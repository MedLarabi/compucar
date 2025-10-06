import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { auth } from '@/lib/auth/config';

// GET /api/courses - Get public courses (free courses and course previews)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';
    const free = searchParams.get('free') === 'true';

    // Build where clause - show PUBLISHED courses to everyone, and DRAFT courses to authenticated users
    const where: any = {
      isActive: true,
    };

    if (session?.user?.id) {
      // Authenticated users can see both PUBLISHED and DRAFT courses
      where.status = { in: ['PUBLISHED', 'DRAFT'] };
    } else {
      // Guests can only see PUBLISHED courses
      where.status = 'PUBLISHED';
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (free) {
      where.isFree = true;
    }

    // Get courses
    const courses = await prisma.course.findMany({
      where,
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
                duration: true,
                thumbnail: true,
                orderIndex: true,
                isPreview: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    });

    // Calculate total duration for each course
    const coursesWithDuration = courses.map(course => {
      const totalDuration = course.modules.reduce((total, module) => {
        return total + module.videos.reduce((moduleTotal, video) => {
          return moduleTotal + (video.duration || 0);
        }, 0);
      }, 0);

      return {
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
        
        // Course stats
        enrollmentCount: course._count.enrollments,
        moduleCount: course._count.modules,
        videoCount: course.modules.reduce((total, module) => total + module.videos.length, 0),
        
        // Preview info for free courses
        hasPreviewVideos: course.modules.some(module => 
          module.videos.some(video => video.isPreview)
        ),
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.course.count({
      where,
    });

    return NextResponse.json({
      courses: coursesWithDuration,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      }
    });

  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}