import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/admin/courses/[courseId]/enrollments - List enrollments for a specific course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { courseId };
    if (status) where.status = status;
    if (source) where.source = source;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const [enrollments, total] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              level: true,
              status: true,
            },
          },
          progress: {
            select: {
              completedVideos: true,
              totalVideos: true,
              completedModules: true,
              totalModules: true,
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.courseEnrollment.count({ where }),
    ]);

    return NextResponse.json({
      course,
      enrollments: enrollments.map(enrollment => ({
        ...enrollment,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        expiresAt: enrollment.expiresAt?.toISOString() || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course enrollments' },
      { status: 500 }
    );
  }
}
