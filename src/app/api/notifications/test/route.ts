import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { NotificationService } from "@/lib/services/notifications";
import { prisma } from "@/lib/database/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log('Creating test notification for admin:', session.user.id);

    // First, verify the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      console.error('User not found in database:', session.user.id);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Create a test notification
    await NotificationService.sendNotification({
      userId: session.user.id,
      type: 'system_error',
      title: 'Test Notification',
      message: 'This is a test notification to verify the notification system is working correctly.',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Test notification created successfully');

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully"
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: "Failed to create test notification" },
      { status: 500 }
    );
  }
}
