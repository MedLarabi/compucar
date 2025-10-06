import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { YalidineService } from "@/lib/services/yalidine-service";

/**
 * Public tracking endpoint
 * GET /api/tracking/YLD123456
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    // Get order information from database
    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
        estimatedDelivery: true,
        shippingAddress: {
          select: {
            address: true,
            city: true,
            state: true,
            country: true
          }
        },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
            image: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Tracking number not found" },
        { status: 404 }
      );
    }

    // Get detailed tracking information from Yalidine
    let yalidineTracking = null;
    try {
      const yalidineResult = await YalidineService.getTrackingInfo(trackingNumber);
      if (yalidineResult.success) {
        yalidineTracking = yalidineResult.parcel;
      }
    } catch (error) {
      console.warn('Could not fetch Yalidine tracking info:', error);
    }

    // Create tracking timeline
    const timeline = [];

    // Order created
    timeline.push({
      status: 'Order Placed',
      description: 'Your order has been placed and is being prepared',
      timestamp: order.createdAt,
      completed: true,
      icon: '📋'
    });

    // Order shipped
    if (order.shippedAt || ['SHIPPED', 'DELIVERED'].includes(order.status)) {
      timeline.push({
        status: 'Shipped',
        description: 'Your package has been picked up and is on its way',
        timestamp: order.shippedAt || null,
        completed: true,
        icon: '📦'
      });
    }

    // Out for delivery (if we have Yalidine data)
    if (yalidineTracking?.status === 'out_for_delivery') {
      timeline.push({
        status: 'Out for Delivery',
        description: 'Your package is out for delivery and will arrive soon',
        timestamp: yalidineTracking.updated_at,
        completed: true,
        icon: '🚚'
      });
    }

    // Delivered
    if (order.deliveredAt || order.status === 'DELIVERED') {
      timeline.push({
        status: 'Delivered',
        description: 'Your package has been delivered successfully',
        timestamp: order.deliveredAt || yalidineTracking?.delivered_at || null,
        completed: true,
        icon: '✅'
      });
    } else {
      // Expected delivery
      timeline.push({
        status: 'Expected Delivery',
        description: 'Estimated delivery date',
        timestamp: order.estimatedDelivery,
        completed: false,
        icon: '🏠'
      });
    }

    // Map order status to user-friendly status
    const statusMap: Record<string, string> = {
      'PENDING': 'Order Placed',
      'SHIPPED': 'In Transit',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'RETURNED': 'Returned'
    };

    const response = {
      success: true,
      tracking: {
        trackingNumber,
        orderNumber: order.orderNumber,
        status: statusMap[order.status] || order.status,
        statusCode: order.status,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        shippingAddress: order.shippingAddress,
        timeline,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price),
          image: item.image
        }))
      }
    };

    // Add Yalidine specific data if available
    if (yalidineTracking) {
      response.tracking = {
        ...response.tracking,
        yalidineStatus: yalidineTracking.status,
        lastUpdate: yalidineTracking.updated_at,
        notes: yalidineTracking.notes
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching tracking information:', error);
    return NextResponse.json(
      { error: "Failed to fetch tracking information" },
      { status: 500 }
    );
  }
}
