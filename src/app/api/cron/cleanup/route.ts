import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Cleanup tasks
    const cleanupResults = await Promise.all([
      // Remove expired promotional codes
      prisma.promotionalCode.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),

      // Remove old notifications (older than 30 days)
      prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),

      // Clean up old sessions
      prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      }),
    ]);

    const result = {
      timestamp: new Date().toISOString(),
      expiredPromotionalCodes: cleanupResults[0].count,
      deletedNotifications: cleanupResults[1].count,
      deletedSessions: cleanupResults[2].count,
    };

    console.log('Cleanup completed:', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
