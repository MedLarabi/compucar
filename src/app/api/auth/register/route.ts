import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { registerUserSchema } from "@/lib/validations";
import { prisma } from "@/lib/database/prisma";
import { NotificationService } from "@/lib/services/notifications";
import { sendWelcomeEmail } from "@/lib/email/hostinger-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = registerUserSchema.parse(body);
    const { name, email, password } = validatedData;

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isActive: true,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Notify admins about new user registration
    await NotificationService.notifyAdminNewUserRegistration(
      user.name || 'Unknown User',
      user.email,
      user.id
    );

    // Send welcome email to the new user
    try {
      console.log(`📧 Sending welcome email to ${user.email}...`);
      const emailSent = await sendWelcomeEmail(
        user.firstName || user.name || 'User',
        user.email,
        `https://compucar.pro/auth/login`
      );
      console.log(`✅ Welcome email sent: ${emailSent}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      { 
        message: "User created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}





