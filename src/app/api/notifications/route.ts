import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isRead = searchParams.get('isRead');

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      userId: session.user.id
    };

    if (isRead !== null && isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.tuningNotification.findMany({
        where: whereClause,
        include: {
          file: {
            select: {
              id: true,
              originalFilename: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.tuningNotification.count({
        where: whereClause
      })
    ]);

    // Format response data
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      priority: 'medium', // Default priority since it's not in the database schema
      fileId: notification.fileId,
      file: notification.file,
      data: notification.data ? JSON.parse(notification.data) : null, // Parse the JSON data
      createdAt: notification.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      data: formattedNotifications, // Keep both for compatibility
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, isRead } = body;

    // Update notification
    const notification = await prisma.tuningNotification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id
      },
      data: {
        isRead: isRead ?? true
      }
    });

    if (notification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}