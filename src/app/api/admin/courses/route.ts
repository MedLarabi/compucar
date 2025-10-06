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

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  thumbnail: z.string().optional(),
  isFree: z.boolean().optional().default(false),
  modules: z.array(z.object({
    title: z.string().min(1, 'Module title is required'),
    description: z.string().optional(),
    orderIndex: z.number(),
    isFree: z.boolean().optional().default(false),
    videos: z.array(z.object({
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

// GET /api/admin/courses - List all courses with stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get courses with counts
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get stats
    const [totalCourses, publishedCourses, totalEnrollments, totalVideos] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.courseEnrollment.count(),
      prisma.courseVideo.count(),
    ]);

    const stats = {
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalVideos,
    };

    return NextResponse.json({
      courses: courses.map(course => ({
        ...course,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      })),
      stats,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/admin/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Generate unique slug
    let baseSlug = generateSlug(validatedData.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        slug: slug,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail,
        level: validatedData.level,
        status: validatedData.status,
        isFree: validatedData.isFree,
        modules: validatedData.modules ? {
          create: validatedData.modules.map(module => ({
            title: module.title,
            description: module.description,
            orderIndex: module.orderIndex,
            isFree: module.isFree || false,
            videos: module.videos ? {
              create: module.videos.map(video => ({
                title: video.title,
                description: video.description,
                videoType: video.videoType || 'S3',
                s3Key: video.s3Key,
                youtubeUrl: video.youtubeUrl,
                youtubeVideoId: video.youtubeVideoId,
                vimeoUrl: video.vimeoUrl,
                vimeoVideoId: video.vimeoVideoId,
                duration: video.duration,
                orderIndex: video.orderIndex,
                isActive: true, // Ensure videos are active by default
                isPreview: video.isPreview || false, // Use provided preview setting
              })),
            } : undefined,
          })),
        } : undefined,
      },
      include: {
        modules: {
          include: {
            videos: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      course: {
        ...course,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
    } catch (error) {
    console.error('Error creating course:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues);
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.issues,
          message: 'Please check the course data format'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
