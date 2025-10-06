import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { getLicenseKeysForOrder } from "@/lib/services/license-key-service";

// GET - Get license keys for a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    
    // Verify the order belongs to the user (for non-admin users)
    if (session.user.role !== "ADMIN") {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id
        }
      });

      if (!order) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }
    }

    const licenseKeys = await getLicenseKeysForOrder(orderId);

    return NextResponse.json({
      success: true,
      licenseKeys
    });
  } catch (error) {
    console.error("Error fetching order license keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch license keys" },
      { status: 500 }
    );
  }
}
