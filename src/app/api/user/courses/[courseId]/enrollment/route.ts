import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

interface RouteParams {
  params: Promise<{
    courseId: string;
  }>;
}

// GET /api/user/courses/[courseId]/enrollment - Check if user is enrolled in course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ enrolled: false });
    }

    const { courseId } = await params;

    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment: enrollment ? {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        expiresAt: enrollment.expiresAt?.toISOString() || null,
        status: enrollment.status,
      } : null,
    });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to check enrollment' },
      { status: 500 }
    );
  }
}
