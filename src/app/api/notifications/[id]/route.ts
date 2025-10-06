import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { NotificationService } from "@/lib/services/notifications";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const success = await NotificationService.deleteNotification(
      id,
      session.user.id
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Notification deleted successfully"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to delete notification or notification not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get single notification (useful for detailed view)
    const notifications = await NotificationService.getUserNotifications(
      session.user.id,
      { limit: 1 }
    );

    const notification = notifications.notifications.find(n => n.id === id);

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { read } = body;

    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request body. 'read' field must be a boolean" },
        { status: 400 }
      );
    }

    const success = await NotificationService.markAsRead(
      id,
      session.user.id
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Notification updated successfully"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to update notification or notification not found" },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}