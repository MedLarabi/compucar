import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/user/courses/[courseId] - Get course details for enrolled user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // First check if the course exists and if it's free (try by ID first, then by slug)
    let courseInfo = await prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true,
      },
      select: {
        id: true,
        isFree: true,
        status: true,
      }
    });

    // If not found by ID, try by slug
    if (!courseInfo) {
      courseInfo = await prisma.course.findUnique({
        where: { 
          slug: courseId,
          isActive: true,
        },
        select: {
          id: true,
          isFree: true,
          status: true,
        }
      });
    }

    if (!courseInfo) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Use the actual course ID for all subsequent queries
    const actualCourseId = courseInfo.id;

    // Check enrollment only if course is not free
    let enrollment = null;
    let isEnrolled = false;

    if (!courseInfo.isFree) {
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: actualCourseId,
          }
        },
        include: {
          progress: true,
        }
      });

      if (!enrollment || enrollment.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: "Not enrolled in this course or enrollment is not active" },
          { status: 403 }
        );
      }
      isEnrolled = true;
    } else {
      // For free courses, check if user has an enrollment (optional)
      enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: actualCourseId,
          }
        },
        include: {
          progress: true,
        }
      });
      isEnrolled = !!enrollment;
    }

    // Get course with full details for enrolled user
    const course = await prisma.course.findUnique({
      where: { 
        id: actualCourseId,
        isActive: true,
      },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
          include: {
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
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Get user's progress
    const userProgress = enrollment?.progress?.[0] || null;

    // Calculate total duration
    const totalDuration = course.modules.reduce((total, module) => {
      return total + module.videos.reduce((moduleTotal, video) => {
        return moduleTotal + (video.duration || 0);
      }, 0);
    }, 0);

    // Add access control to videos - enrolled users and free course users can access all videos
    const modulesWithAccess = course.modules.map(module => ({
      ...module,
      videoCount: module.videos.length, // Add video count for UI
      videos: module.videos.map(video => ({
        ...video,
        canAccess: true, // Users can access all videos (either enrolled or free course)
      }))
    }));

    console.log('Course modules with access:', modulesWithAccess.length);
    console.log('First module videos:', modulesWithAccess[0]?.videos?.length || 0);
    
    // Debug: Log all modules and their videos
    modulesWithAccess.forEach((module, index) => {
      console.log(`Module ${index + 1}: "${module.title}" - ${module.videos?.length || 0} videos`);
      if (module.videos) {
        module.videos.forEach((video, videoIndex) => {
          console.log(`  Video ${videoIndex + 1}: "${video.title}" (${video.videoType}) - Active: ${video.isActive !== false}`);
        });
      }
    });

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
      
      // Add isEnrolled field that the frontend expects
      isEnrolled: isEnrolled, // User is enrolled or course is free
      
      modules: modulesWithAccess,
      
      enrollment: enrollment ? {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        expiresAt: enrollment.expiresAt?.toISOString() || null,
        status: enrollment.status,
        source: enrollment.source,
        progressPercent: enrollment.progressPercent,
        completedAt: enrollment.completedAt?.toISOString() || null,
        lastAccessAt: enrollment.lastAccessAt?.toISOString() || null,
      } : null,
      
      // Map progress data to match frontend expectations
      userProgress: userProgress ? {
        completedModules: userProgress.completedModules,
        totalModules: userProgress.totalModules,
        completedVideos: userProgress.completedVideos,
        totalVideos: userProgress.totalVideos,
        watchTimeMinutes: userProgress.watchTimeMinutes,
        progressPercent: enrollment?.progressPercent || 0,
        lastWatchedAt: userProgress.lastWatchedAt?.toISOString() || null,
      } : null,
      
      progress: userProgress ? {
        completedModules: userProgress.completedModules,
        totalModules: userProgress.totalModules,
        completedVideos: userProgress.completedVideos,
        totalVideos: userProgress.totalVideos,
        watchTimeMinutes: userProgress.watchTimeMinutes,
        lastWatchedAt: userProgress.lastWatchedAt?.toISOString() || null,
        completedAt: userProgress.completedAt?.toISOString() || null,
      } : null,
      
      _count: course._count,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching course for user:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to fetch course",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
