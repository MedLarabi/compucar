import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";
import { NotificationService } from "@/lib/services/notifications";

// Schema for review submission
const reviewSubmissionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().optional(),
  content: z.string().optional(), // Made optional - no minimum length required
});

// GET - Fetch approved reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Find the product first
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch approved reviews
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: product.id,
        isApproved: true
      },
      select: {
        id: true,
        name: true,
        rating: true,
        title: true,
        content: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Submit a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = reviewSubmissionSchema.parse(body);

    // Find the product
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, name: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId: product.id,
        email: validatedData.email
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Create the review (pending approval)
    const review = await prisma.productReview.create({
      data: {
        productId: product.id,
        name: validatedData.name,
        email: validatedData.email,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content || "", // Handle empty content gracefully
        isApproved: false, // Requires admin approval
        isVerified: false
      }
    });

    // Send notification to all admin users
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'SUPER_ADMIN']
          }
        },
        select: { id: true }
      });

      // Send notification to each admin
      for (const admin of adminUsers) {
        await NotificationService.sendNewReviewSubmitted(
          admin.id,
          product.name,
          validatedData.name,
          validatedData.rating,
          review.id
        );
      }
    } catch (notificationError) {
      console.error('Error sending review notification:', notificationError);
      // Don't fail the review submission if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully! It will be published after admin approval.",
      data: {
        id: review.id,
        name: review.name,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
