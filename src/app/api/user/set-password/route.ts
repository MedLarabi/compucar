import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const setPasswordSchema = z.object({
  newPassword: z.string().min(1, "Password is required"),
});

// POST - Set password for users who don't have one (OAuth users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newPassword } = setPasswordSchema.parse(body);

    // Get user to check if they already have a password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: "user_not_found",
          message: "User not found" 
        },
        { status: 404 }
      );
    }

    if (user.password) {
      return NextResponse.json(
        { 
          error: "password_already_exists",
          message: "User already has a password. Use password change instead." 
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Set password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    console.log(`Password set for user: ${user.email}`);

    return NextResponse.json({ 
      success: true,
      message: "password_set_success" 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "validation_error",
          message: "Invalid input data",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    console.error("Error setting password:", error);
    return NextResponse.json(
      { 
        error: "server_error",
        message: "An unexpected error occurred. Please try again." 
      },
      { status: 500 }
    );
  }
}
