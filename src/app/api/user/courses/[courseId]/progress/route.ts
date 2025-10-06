import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

// GET - Get user's progress for a specific course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Get enrollment and progress
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        }
      },
      include: {
        progress: {
          include: {
            videoProgress: {
              include: {
                video: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    moduleId: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const progress = enrollment.progress[0];

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        completedAt: enrollment.completedAt?.toISOString(),
        lastAccessAt: enrollment.lastAccessAt?.toISOString(),
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
      videoProgress: progress?.videoProgress.map(vp => ({
        videoId: vp.videoId,
        videoTitle: vp.video.title,
        moduleId: vp.video.moduleId,
        watchedSeconds: vp.watchedSeconds,
        totalSeconds: vp.totalSeconds,
        isCompleted: vp.isCompleted,
        completedAt: vp.completedAt?.toISOString(),
        lastWatchedAt: vp.lastWatchedAt.toISOString(),
        progressPercent: vp.totalSeconds > 0 ? Math.round((vp.watchedSeconds / vp.totalSeconds) * 100) : 0,
      })) || [],
    });

  } catch (error) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update video progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const body = await request.json();
    const { videoId, watchedSeconds, totalSeconds } = body;

    if (!videoId || typeof watchedSeconds !== 'number' || typeof totalSeconds !== 'number') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        }
      },
      include: {
        progress: true,
      }
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Verify video belongs to this course
    const video = await prisma.courseVideo.findUnique({
      where: { id: videoId },
      include: {
        module: {
          select: {
            courseId: true,
          }
        }
      }
    });

    if (!video || video.module.courseId !== courseId) {
      return NextResponse.json(
        { error: "Video not found in this course" },
        { status: 404 }
      );
    }

    // Determine if video is completed (90% threshold)
    const isCompleted = watchedSeconds >= totalSeconds * 0.9;
    const completedAt = isCompleted ? new Date() : null;

    // Get or create course progress
    let courseProgress = enrollment.progress[0];
    if (!courseProgress) {
      // Get course structure to initialize progress
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          modules: {
            where: { isActive: true },
            include: {
              videos: {
                where: { isActive: true }
              }
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

      const totalModules = course.modules.length;
      const totalVideos = course.modules.reduce((sum, module) => sum + module.videos.length, 0);

      courseProgress = await prisma.courseProgress.create({
        data: {
          userId: session.user.id,
          courseId: courseId,
          enrollmentId: enrollment.id,
          totalModules,
          totalVideos,
        }
      });
    }

    // Update or create video progress
    const videoProgress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId,
        }
      },
      update: {
        watchedSeconds,
        totalSeconds,
        isCompleted,
        completedAt,
        lastWatchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        videoId: videoId,
        courseProgressId: courseProgress.id,
        watchedSeconds,
        totalSeconds,
        isCompleted,
        completedAt,
        lastWatchedAt: new Date(),
      }
    });

    // Recalculate course progress
    const allVideoProgress = await prisma.videoProgress.findMany({
      where: {
        courseProgressId: courseProgress.id,
      }
    });

    const completedVideos = allVideoProgress.filter(vp => vp.isCompleted).length;
    const totalWatchTime = allVideoProgress.reduce((sum, vp) => sum + vp.watchedSeconds, 0);
    const progressPercent = courseProgress.totalVideos > 0 
      ? Math.round((completedVideos / courseProgress.totalVideos) * 100) 
      : 0;

    // Check if course is completed
    const courseCompleted = progressPercent >= 100;

    // Update course progress
    await prisma.courseProgress.update({
      where: { id: courseProgress.id },
      data: {
        completedVideos,
        watchTimeMinutes: Math.round(totalWatchTime / 60),
        lastWatchedAt: new Date(),
        completedAt: courseCompleted ? new Date() : null,
      }
    });

    // Update enrollment
    await prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        lastAccessAt: new Date(),
        completedAt: courseCompleted ? new Date() : null,
        status: courseCompleted ? 'COMPLETED' : 'ACTIVE',
      }
    });

    return NextResponse.json({
      success: true,
      videoProgress: {
        videoId: videoProgress.videoId,
        watchedSeconds: videoProgress.watchedSeconds,
        totalSeconds: videoProgress.totalSeconds,
        isCompleted: videoProgress.isCompleted,
        completedAt: videoProgress.completedAt?.toISOString(),
        progressPercent: totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0,
      },
      courseProgress: {
        completedVideos,
        totalVideos: courseProgress.totalVideos,
        progressPercent,
        courseCompleted,
      }
    });

  } catch (error) {
    console.error("Error updating course progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
