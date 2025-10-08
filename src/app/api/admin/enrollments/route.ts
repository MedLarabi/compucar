import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

// GET /api/admin/enrollments - List all enrollments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (courseId) where.courseId = courseId;
    if (userId) where.userId = userId;

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
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
