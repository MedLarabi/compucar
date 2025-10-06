import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { NotificationService } from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const count = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
