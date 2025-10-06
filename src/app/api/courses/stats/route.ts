import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

// GET /api/courses/stats - Get course statistics
export async function GET(request: NextRequest) {
  try {
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalVideos,
      totalDuration,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.courseEnrollment.count(),
      prisma.courseVideo.count(),
      prisma.courseVideo.aggregate({
        _sum: {
          duration: true,
        },
      }),
    ]);

    const stats = {
      totalCourses: publishedCourses, // Only show published courses in public stats
      publishedCourses,
      totalEnrollments,
      totalVideos,
      totalDuration: totalDuration._sum.duration || 0,
      averageRating: 4.8, // Placeholder - you can calculate this from reviews later
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course statistics' },
      { status: 500 }
    );
  }
}
