import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
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

    console.log('Seeding notifications for admin:', session.user.id);

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

    // Create sample notifications
    const sampleNotifications = [
      {
        userId: session.user.id,
        type: 'new_order_received',
        title: 'New Order Received',
        message: 'Order #ORD-001 has been placed by customer John Doe',
        priority: 'high',
        data: { orderId: 'ORD-001', customerName: 'John Doe' }
      },
      {
        userId: session.user.id,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: 'Product "Premium Brake Pads" is running low on stock (5 remaining)',
        priority: 'medium',
        data: { productId: 'PROD-001', currentStock: 5 }
      },
      {
        userId: session.user.id,
        type: 'system_error',
        title: 'System Maintenance',
        message: 'Scheduled maintenance completed successfully. All systems are operational.',
        priority: 'low',
        data: { maintenanceType: 'scheduled', status: 'completed' }
      },
      {
        userId: session.user.id,
        type: 'new_review_submitted',
        title: 'New Product Review',
        message: 'Customer Sarah Smith submitted a 5-star review for "LED Headlights"',
        priority: 'medium',
        data: { productId: 'PROD-002', rating: 5, customerName: 'Sarah Smith' }
      },
      {
        userId: session.user.id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Payment for order #ORD-002 failed. Customer needs to update payment method.',
        priority: 'high',
        data: { orderId: 'ORD-002', reason: 'insufficient_funds' }
      }
    ];

    // Insert sample notifications
    const createdNotifications = await prisma.notification.createMany({
      data: sampleNotifications
    });

    console.log('Created sample notifications:', createdNotifications.count);

    return NextResponse.json({
      success: true,
      message: `Created ${createdNotifications.count} sample notifications`,
      count: createdNotifications.count
    });

  } catch (error) {
    console.error('Error seeding notifications:', error);
    return NextResponse.json(
      { error: "Failed to seed notifications" },
      { status: 500 }
    );
  }
}
