import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { NotificationService } from "@/lib/services/notifications";

export async function POST(
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

    const success = await NotificationService.markAsRead(
      id,
      session.user.id
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Notification marked as read"
      });
    } else {
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
