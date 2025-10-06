import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { generateSignedVideoUrl } from "@/lib/aws";

// GET - Get signed video URL for streaming
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; videoId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId, videoId } = await params;

    // Get video details and check access
    const video = await prisma.courseVideo.findUnique({
      where: { id: videoId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
                isActive: true,
              }
            }
          }
        }
      }
    });

    if (!video || !video.isActive) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Verify course ID matches
    if (video.module.course.id !== courseId) {
      return NextResponse.json(
        { error: "Invalid course ID" },
        { status: 400 }
      );
    }

    // Check if course is published and active
    if (video.module.course.status !== 'PUBLISHED' || !video.module.course.isActive) {
      return NextResponse.json(
        { error: "Course not available" },
        { status: 403 }
      );
    }

    // Check if user has access to this video
    let hasAccess = false;

    // Check if it's a preview video (free access)
    if (video.isPreview) {
      hasAccess = true;
    } else {
      // Check if user is enrolled in the course
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId,
          }
        }
      });

      hasAccess = !!(enrollment && 
        enrollment.status === 'ACTIVE' && 
        (!enrollment.expiresAt || enrollment.expiresAt > new Date())
      );
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. Please enroll in the course to watch this video." },
        { status: 403 }
      );
    }

    // Generate signed CloudFront URL for S3 videos only
    let signedUrl = null;
    if (video.videoType === 'S3' && video.s3Key) {
      try {
        signedUrl = generateSignedVideoUrl({
          key: video.s3Key,
          expiresIn: 14400, // 4 hours
          // Optional: Add IP restriction
          // ipAddress: request.ip,
        });
      } catch (error) {
        console.error('Error generating signed URL:', error);
        // For development/demo purposes, provide a fallback URL
        console.warn('AWS CloudFront not configured, using fallback for development');
        signedUrl = `https://example.com/demo-video.mp4`; // Demo fallback
      }
    }

    // Update last access time if user is enrolled
    if (!video.isPreview) {
      await prisma.courseEnrollment.update({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: courseId,
          }
        },
        data: {
          lastAccessAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      videoUrl: signedUrl,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        videoType: video.videoType,
        youtubeVideoId: video.youtubeVideoId,
        vimeoVideoId: video.vimeoVideoId,
        duration: video.duration,
        thumbnail: video.thumbnail,
        isPreview: video.isPreview,
      },
      expiresAt: signedUrl ? new Date(Date.now() + 14400 * 1000).toISOString() : null, // 4 hours from now for S3 videos
    });

  } catch (error) {
    console.error("Error generating video stream URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
