import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { sendWelcomeEmail } from '@/lib/services/email-service';
import { prisma } from '@/lib/database/prisma';

// Helper function to complete order setup (same as in orders/route.ts but exported here)
async function completeOrderSetup(orderId: string, userId: string | null) {
  const { createDownloadsForOrder } = await import('@/lib/services/download-service');
  const { assignLicenseKeyToOrder } = await import('@/lib/services/license-key-service');
  const { processOrderCourseEnrollments } = await import('@/lib/services/course-enrollment');
  
  try {
    // Create downloads for virtual products
    await createDownloadsForOrder(orderId);
    
    // Process course enrollments for products with associated courses
    try {
      const courseEnrollments = await processOrderCourseEnrollments(orderId);
      if (courseEnrollments.length > 0) {
        console.log(`Successfully enrolled user in ${courseEnrollments.length} courses for order ${orderId}:`, 
          courseEnrollments.map(e => e.courseTitle).join(', '));
      }
    } catch (courseError) {
      console.error('Error processing course enrollments:', courseError);
      // Continue with other setup tasks even if course enrollment fails
    }
    
    // Assign license keys for virtual products
    const orderWithItems = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: { isVirtual: true }
            }
          }
        }
      }
    });

    if (orderWithItems) {
      let hasVirtualProducts = false;
      let allProductsVirtual = true;

      for (const item of orderWithItems.items) {
        if (item.product.isVirtual) {
          hasVirtualProducts = true;
          try {
            // Assign one license key per quantity purchased
            for (let i = 0; i < item.quantity; i++) {
              await assignLicenseKeyToOrder(item.productId, orderId, userId);
            }
          } catch (error) {
            console.error(`Error assigning license key for product ${item.productId}:`, error);
            // Continue with other products even if one fails
          }
        } else {
          allProductsVirtual = false;
        }
      }

      // If all products are virtual/digital, automatically mark order as delivered
      if (hasVirtualProducts && allProductsVirtual) {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: 'DELIVERED',
            deliveredAt: new Date()
          }
        });
        console.log(`Order ${orderId} automatically marked as DELIVERED - all products are virtual/digital`);

        // Send notification to admins about the auto-completion
        try {
          const { NotificationService } = await import('@/lib/services/notifications');
          await NotificationService.sendVirtualOrderCompleted(orderId, orderWithItems.orderNumber || orderId);
        } catch (notificationError) {
          console.error('Error sending virtual order completion notification:', notificationError);
          // Don't fail the order process if notification fails
        }
      }
    }

    console.log(`Order setup completed for order ${orderId}`);
  } catch (error) {
    console.error("Error completing order setup:", error);
    throw error;
  }
}

/**
 * Payment confirmation webhook endpoint
 * This endpoint should be called by payment gateways to confirm successful payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      transactionId, 
      paymentMethod, 
      amount,
      status,
      webhookSecret 
    } = body;

    // Validate required fields
    if (!orderId || !transactionId || !paymentMethod || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature/secret for security
    // In production, you should verify the webhook came from your payment provider
    // if (webhookSecret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 403 });
    // }

    console.log('Payment confirmation webhook received:', {
      orderId,
      transactionId,
      paymentMethod,
      amount,
      status
    });

    if (status === 'succeeded' || status === 'completed') {
      // Confirm the payment
      const confirmResult = await PaymentService.confirmPayment(
        orderId,
        transactionId,
        paymentMethod,
        amount
      );

      if (!confirmResult.success) {
        return NextResponse.json(
          { error: confirmResult.error },
          { status: 400 }
        );
      }

      // Complete order setup (downloads, license keys, etc.)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (order) {
        try {
          await completeOrderSetup(orderId, order.userId);
          
          // Send confirmation email
          if (order.user?.email) {
            // TODO: Send order confirmation email with invoice
            console.log(`Should send confirmation email to ${order.user.email} for order ${orderId}`);
          }
        } catch (setupError) {
          console.error('Error completing order setup after payment:', setupError);
          // Don't fail the webhook - payment was successful
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed and order completed'
      });

    } else if (status === 'failed' || status === 'canceled') {
      // Handle failed payment
      await PaymentService.handleFailedPayment(orderId, `Payment ${status}`, transactionId);
      
      return NextResponse.json({
        success: true,
        message: 'Payment failure handled'
      });

    } else {
      return NextResponse.json(
        { error: `Unknown payment status: ${status}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment confirmation webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Manual payment confirmation endpoint (for testing)
 * This allows manual confirmation of payments for testing purposes
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, transactionId, amount } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Confirm the payment manually
    const confirmResult = await PaymentService.confirmPayment(
      orderId,
      transactionId || `manual_${Date.now()}`,
      'manual',
      amount || 0
    );

    if (!confirmResult.success) {
      return NextResponse.json(
        { error: confirmResult.error },
        { status: 400 }
      );
    }

    // Complete order setup
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (order) {
      await completeOrderSetup(orderId, order.userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment manually confirmed and order completed'
    });

  } catch (error) {
    console.error('Manual payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Manual confirmation failed' },
      { status: 500 }
    );
  }
}

