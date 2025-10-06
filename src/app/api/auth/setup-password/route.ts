import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";

const setupPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  email: z.string().email("Valid email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = setupPasswordSchema.parse(body);

    console.log('Password setup request:', {
      email,
      hasToken: !!token,
      timestamp: new Date().toISOString()
    });

    // Find user by email and verify they need password setup
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found for password setup:', email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // For now, we'll verify the token is the user's ID (simple verification)
    // In production, you might want a more sophisticated token system
    if (token !== user.id) {
      console.log('Invalid token for password setup:', { email, token, userId: user.id });
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        emailVerified: new Date(), // Mark email as verified
      }
    });

    console.log('Password setup successful:', email);

    return NextResponse.json({
      success: true,
      message: "Password set successfully"
    });

  } catch (error) {
    console.error("Password setup error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}
