import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { NotificationService } from "@/lib/services/notifications";
import { z } from "zod";
import bcrypt from "bcryptjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"), // Removed complexity requirements
});

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    });

    console.log(`Password reset attempt for user: ${user?.email}, has password: ${!!user?.password}`);

    if (!user) {
      return NextResponse.json(
        { 
          error: "user_not_found",
          message: "User not found" 
        },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { 
          error: "no_password_set",
          message: "No password set for this account. This account may have been created through social login." 
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log(`Incorrect password attempt for user: ${user.email}`);
      return NextResponse.json(
        { 
          error: "incorrect_password",
          message: "Current password is incorrect" 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword },
    });

    // Notify customer about password change
    await NotificationService.notifyCustomerPasswordChanged(session.user.id);

    console.log(`Password changed successfully for user: ${user.email}`);
    
    return NextResponse.json({ 
      success: true,
      message: "password_changed_success"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "validation_error",
          message: "Invalid input data",
          details: error.issues 
        },
        { status: 400 }
      );
    }

    console.error("Error changing password:", error);
    return NextResponse.json(
      { 
        error: "server_error",
        message: "An unexpected error occurred. Please try again." 
      },
      { status: 500 }
    );
  }
}
