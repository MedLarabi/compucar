import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// GET - Get user's enrolled courses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'completed', 'expired'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      switch (status) {
        case 'active':
          where.status = 'ACTIVE';
          where.OR = [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ];
          break;
        case 'completed':
          where.status = 'COMPLETED';
          break;
        case 'expired':
          where.status = 'EXPIRED';
          break;
      }
    }

    // Get user's enrollments with course details
    const [enrollments, total] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              shortDescription: true,
              thumbnail: true,
              duration: true,
              level: true,
              language: true,
              certificateEnabled: true,
              _count: {
                select: {
                  modules: {
                    where: { isActive: true }
                  }
                }
              }
            }
          },
          progress: {
            select: {
              completedModules: true,
              totalModules: true,
              completedVideos: true,
              totalVideos: true,
              watchTimeMinutes: true,
              lastWatchedAt: true,
              completedAt: true,
            }
          }
        },
        orderBy: [
          { lastAccessAt: 'desc' },
          { enrolledAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.courseEnrollment.count({ where })
    ]);

    // Format response
    const courses = enrollments.map(enrollment => {
      const progress = enrollment.progress[0];
      
      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        expiresAt: enrollment.expiresAt?.toISOString(),
        status: enrollment.status,
        source: enrollment.source,
        lastAccessAt: enrollment.lastAccessAt?.toISOString(),
        progressPercent: enrollment.progressPercent,
        completedAt: enrollment.completedAt?.toISOString(),
        
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          shortDescription: enrollment.course.shortDescription,
          thumbnail: enrollment.course.thumbnail,
          duration: enrollment.course.duration,
          level: enrollment.course.level,
          language: enrollment.course.language,
          certificateEnabled: enrollment.course.certificateEnabled,
          moduleCount: enrollment.course._count.modules,
        },
        
        progress: progress ? {
          completedModules: progress.completedModules,
          totalModules: progress.totalModules,
          completedVideos: progress.completedVideos,
          totalVideos: progress.totalVideos,
          watchTimeMinutes: progress.watchTimeMinutes,
          lastWatchedAt: progress.lastWatchedAt?.toISOString(),
          completedAt: progress.completedAt?.toISOString(),
        } : null,
      };
    });

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error("Error fetching user courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
