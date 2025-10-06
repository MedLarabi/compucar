import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { YalidineService } from "@/lib/services/yalidine-service";
import { z } from "zod";

// Schema for creating a Yalidine parcel
const createParcelSchema = z.object({
  orderId: z.string(),
  recipient: z.object({
    name: z.string().min(1),
    phone: z.string().min(8),
    address: z.string().min(10),
    commune: z.string().min(1),
    wilaya: z.string().min(1)
  }),
  cashOnDelivery: z.number().min(0),
  shippingCost: z.number().optional().default(0)
});

/**
 * Create a parcel with Yalidine for shipping
 * POST /api/admin/shipping/yalidine
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createParcelSchema.parse(body);

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        shippingAddress: true,
        user: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.trackingNumber) {
      return NextResponse.json(
        { error: "Order already has a tracking number" },
        { status: 400 }
      );
    }

    // Prepare items data for Yalidine
    const items = order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price)
    }));

    // Create parcel with Yalidine
    const result = await YalidineService.createParcel({
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipient: validatedData.recipient,
      items,
      cashOnDelivery: validatedData.cashOnDelivery,
      shippingCost: validatedData.shippingCost
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Parcel created successfully",
      trackingNumber: result.trackingNumber
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating Yalidine parcel:', error);
    return NextResponse.json(
      { error: "Failed to create parcel" },
      { status: 500 }
    );
  }
}

/**
 * Get tracking information for a parcel
 * GET /api/admin/shipping/yalidine?trackingNumber=YLD123456
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber');

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    // Get tracking information
    const result = await YalidineService.getTrackingInfo(trackingNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      parcel: result.parcel
    });

  } catch (error) {
    console.error('Error fetching tracking info:', error);
    return NextResponse.json(
      { error: "Failed to fetch tracking information" },
      { status: 500 }
    );
  }
}
