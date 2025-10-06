import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { z } from 'zod';

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const updateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  thumbnail: z.string().optional(),
  isFree: z.boolean().optional().default(false),
  modules: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Module title is required'),
    description: z.string().optional(),
    orderIndex: z.number(),
    isFree: z.boolean().optional().default(false),
    videos: z.array(z.object({
      id: z.string().optional(),
      title: z.string().min(1, 'Video title is required'),
      description: z.string().optional(),
      videoType: z.enum(['S3', 'YOUTUBE', 'VIMEO']).default('S3'),
      s3Key: z.string().optional(),
      youtubeUrl: z.string().optional(),
      youtubeVideoId: z.string().optional(),
      vimeoUrl: z.string().optional().nullable(),
      vimeoVideoId: z.string().optional().nullable(),
      duration: z.union([z.number(), z.null()]).optional(),
      orderIndex: z.number(),
      isPreview: z.boolean().optional().default(false),
    }).refine((data) => {
      if (data.videoType === 'S3') {
        return data.s3Key && data.s3Key.length > 0;
      }
      if (data.videoType === 'YOUTUBE') {
        if (!data.youtubeUrl || data.youtubeUrl.length === 0) {
          return false;
        }
        // Basic validation for YouTube URL or iframe
        return data.youtubeUrl.includes('youtube.com') || data.youtubeUrl.includes('youtu.be');
      }
      if (data.videoType === 'VIMEO') {
        if (!data.vimeoUrl || data.vimeoUrl.length === 0) {
          return false;
        }
        // Basic validation for Vimeo URL or iframe
        return data.vimeoUrl.includes('vimeo.com') || data.vimeoUrl.includes('player.vimeo.com');
      }
      return false;
    }, {
      message: 'For S3 videos, provide an S3 key. For YouTube videos, provide a valid YouTube URL or iframe embed code. For Vimeo videos, provide a valid Vimeo URL or iframe embed code.',
    })).optional(),
  })).optional(),
});

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/admin/courses/[courseId] - Get course details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            videos: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      course: {
        ...course,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/courses/[courseId] - Update course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            videos: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Generate unique slug if title changed
    let slug = existingCourse.slug;
    if (validatedData.title !== existingCourse.title) {
      let baseSlug = generateSlug(validatedData.title);
      slug = baseSlug;
      let counter = 1;
      
      // Ensure slug is unique (excluding current course)
      while (await prisma.course.findFirst({ 
        where: { 
          slug: slug,
          id: { not: courseId }
        } 
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update course in a transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Update basic course info
      const course = await tx.course.update({
        where: { id: courseId },
        data: {
          title: validatedData.title,
          slug: slug,
          description: validatedData.description,
          thumbnail: validatedData.thumbnail,
          level: validatedData.level,
          status: validatedData.status,
          isFree: validatedData.isFree,
        },
      });

      // Handle modules if provided
      if (validatedData.modules) {
        // Delete existing modules and videos
        await tx.courseVideo.deleteMany({
          where: {
            module: {
              courseId: courseId,
            },
          },
        });
        await tx.courseModule.deleteMany({
          where: { courseId: courseId },
        });

        // Create new modules and videos
        for (const moduleData of validatedData.modules) {
          const module = await tx.courseModule.create({
            data: {
              courseId: courseId,
              title: moduleData.title,
              description: moduleData.description,
              orderIndex: moduleData.orderIndex,
              isFree: moduleData.isFree || false,
            },
          });

          if (moduleData.videos) {
            for (const videoData of moduleData.videos) {
              await tx.courseVideo.create({
                data: {
                  moduleId: module.id,
                  title: videoData.title,
                  description: videoData.description,
                  videoType: videoData.videoType || 'S3',
                  s3Key: videoData.s3Key,
                  youtubeUrl: videoData.youtubeUrl,
                  youtubeVideoId: videoData.youtubeVideoId,
                  vimeoUrl: videoData.vimeoUrl,
                  vimeoVideoId: videoData.vimeoVideoId,
                  duration: videoData.duration,
                  orderIndex: videoData.orderIndex,
                  isActive: true, // Ensure videos are active by default
                  isPreview: videoData.isPreview || false, // Use provided preview setting
                },
              });
            }
          }
        }
      }

      return course;
    });

    // Fetch the complete updated course
    const completeUpdatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            videos: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({
      course: {
        ...completeUpdatedCourse,
        createdAt: completeUpdatedCourse!.createdAt.toISOString(),
        updatedAt: completeUpdatedCourse!.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/courses/[courseId] - Delete course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course has active enrollments
    if (existingCourse._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments' },
        { status: 400 }
      );
    }

    // Delete course and related data
    await prisma.$transaction(async (tx) => {
      // Delete videos
      await tx.courseVideo.deleteMany({
        where: {
          module: {
            courseId: courseId,
          },
        },
      });

      // Delete modules
      await tx.courseModule.deleteMany({
        where: { courseId: courseId },
      });

      // Delete course
      await tx.course.delete({
        where: { id: courseId },
      });
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
