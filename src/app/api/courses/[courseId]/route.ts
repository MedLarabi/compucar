import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { auth } from '@/lib/auth/config';

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/courses/[courseId] - Get course details (supports both ID and slug lookup)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const session = await auth();

    // Try to find course by ID first, then by slug
    let course = await prisma.course.findUnique({
      where: { 
        id: courseId,
        status: 'PUBLISHED',
        isActive: true,
      },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            orderIndex: true,
            isFree: true,
            videos: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                videoType: true,
                s3Key: true,
                s3Bucket: true,
                youtubeUrl: true,
                youtubeVideoId: true,
                vimeoUrl: true,
                vimeoVideoId: true,
                duration: true,
                thumbnail: true,
                orderIndex: true,
                isPreview: true,
                isActive: true,
              }
            }
          }
        },
        reviews: {
          where: { isApproved: true },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                image: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        tags: {
          select: {
            name: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: {
              where: { isApproved: true }
            }
          }
        }
      }
    });

    // If not found by ID, try by slug
    if (!course) {
      course = await prisma.course.findUnique({
        where: { 
          slug: courseId,
          status: 'PUBLISHED',
          isActive: true,
        },
        include: {
          modules: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              orderIndex: true,
              isFree: true,
              videos: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  videoType: true,
                  s3Key: true,
                  s3Bucket: true,
                  youtubeUrl: true,
                  youtubeVideoId: true,
                  vimeoUrl: true,
                  vimeoVideoId: true,
                  duration: true,
                  thumbnail: true,
                  orderIndex: true,
                  isPreview: true,
                  isActive: true,
                }
              }
            }
          },
          reviews: {
            where: { isApproved: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true,
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          tags: {
            select: {
              name: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              reviews: {
                where: { isApproved: true }
              }
            }
          }
        }
      });
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    let enrollment = null;
    let userProgress = null;

    if (session?.user?.id) {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          }
        },
        include: {
          progress: true,
        }
      });

      isEnrolled = !!enrollment && enrollment.status === 'ACTIVE';
      userProgress = enrollment?.progress[0] || null;
    }

    // Calculate total duration
    const totalDuration = course.modules.reduce((total, module) => {
      return total + module.videos.reduce((moduleTotal, video) => {
        return moduleTotal + (video.duration || 0);
      }, 0);
    }, 0);

    // Calculate average rating if reviews exist
    const ratings = course.reviews?.map(r => r.rating) || [];
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    // Access control logic:
    // - Free courses: all videos accessible
    // - Enrolled users: all videos accessible  
    // - Free modules in paid courses: all videos accessible
    // - Paid modules in paid courses: only preview videos accessible to non-enrolled users
    const modulesWithAccess = course.modules.map(module => ({
      ...module,
      videoCount: module.videos.length,
      canAccess: course.isFree || isEnrolled || module.isFree,
      videos: module.videos.map(video => ({
        ...video,
        canAccess: course.isFree || isEnrolled || module.isFree || video.isPreview,
      }))
    }));

    // Format response
    const response = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      price: course.price,
      compareAtPrice: course.compareAtPrice,
      duration: totalDuration,
      level: course.level,
      language: course.language,
      status: course.status,
      isActive: course.isActive,
      isFeatured: course.isFeatured,
      isFree: course.isFree,
      allowPreview: course.allowPreview,
      certificateEnabled: course.certificateEnabled,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      publishedAt: course.publishedAt?.toISOString() || null,
      
      // Public access info
      isPubliclyAccessible: course.isFree,
      requiresEnrollment: !course.isFree,
      
      modules: modulesWithAccess,
      
      // Reviews and ratings
      reviews: course.reviews?.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt.toISOString(),
        user: {
          name: `${review.user.firstName} ${review.user.lastName}`,
          image: review.user.image,
        }
      })) || [],
      
      // Tags
      tags: course.tags?.map(tag => tag.name) || [],
      
      // Course stats
      enrollmentCount: course._count.enrollments,
      reviewCount: course._count.reviews || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      moduleCount: course.modules.length,
      videoCount: course.modules.reduce((total, module) => total + module.videos.length, 0),
      previewVideoCount: course.modules.reduce((total, module) => 
        total + module.videos.filter(video => video.isPreview).length, 0
      ),
      
      // User-specific data
      isEnrolled,
      userProgress: userProgress ? {
        completedModules: userProgress.completedModules,
        totalModules: userProgress.totalModules,
        completedVideos: userProgress.completedVideos,
        totalVideos: userProgress.totalVideos,
        watchTimeMinutes: userProgress.watchTimeMinutes,
        progressPercent: enrollment?.progressPercent || 0,
        lastWatchedAt: userProgress.lastWatchedAt?.toISOString(),
        completedAt: userProgress.completedAt?.toISOString(),
      } : null,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching public course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
