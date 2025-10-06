import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { createDownloadsForOrder } from "@/lib/services/download-service";
import { assignLicenseKeyToOrder } from "@/lib/services/license-key-service";
import { generateRandomPassword, sendWelcomeEmail } from "@/lib/services/email-service";
import { PaymentService } from "@/lib/services/payment-service";
import { NotificationService } from "@/lib/services/notifications";
import bcrypt from "bcryptjs";

// Helper function to complete order setup (downloads, license keys, etc.)
async function completeOrderSetup(orderId: string, userId: string | null) {
  try {
    // Create downloads for virtual products
    await createDownloadsForOrder(orderId);
    
    // Process course enrollments for products with associated courses
    if (userId) {
      try {
        const { processOrderCourseEnrollments } = await import('@/lib/services/course-enrollment');
        const courseEnrollments = await processOrderCourseEnrollments(orderId);
        if (courseEnrollments.length > 0) {
          console.log(`Successfully enrolled user in ${courseEnrollments.length} courses for order ${orderId}:`, 
            courseEnrollments.map(e => e.courseTitle).join(', '));
        }
      } catch (courseError) {
        console.error('Error processing course enrollments:', courseError);
        // Continue with other setup tasks even if course enrollment fails
      }
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
              await assignLicenseKeyToOrder(item.productId, orderId, userId || undefined);
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        yalidine: {
          select: {
            tracking: true,
            status: true,
            label_url: true,
            to_wilaya_name: true,
            to_commune_name: true,
            is_stopdesk: true,
            price: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform orders to include proper status and tracking info
    const transformedOrders = orders.map(order => ({
      ...order,
      // For COD orders, use codStatus as the main status, otherwise use regular status
      displayStatus: order.paymentMethod === 'COD' ? (order.codStatus || 'PENDING') : order.status,
      // Include tracking information if available
      tracking: order.yalidine?.tracking || null,
      trackingStatus: order.yalidine?.status || null,
      shippingInfo: order.yalidine ? {
        wilaya: order.yalidine.to_wilaya_name,
        commune: order.yalidine.to_commune_name,
        isStopdesk: order.yalidine.is_stopdesk,
        shippingCost: order.yalidine.price,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await auth();
    
    // For guest checkout, we don't require authentication
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const {
      customerInfo,
      items,
      subtotal,
      total,
    } = body;

    // Extract payment method for paid orders
    const paymentMethod = customerInfo.paymentMethod || 'stripe';

    // Enhanced validation and logging for guest/authenticated checkout
    console.log('Order creation request:', {
      isGuest: !session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      customerInfo,
      itemsCount: items?.length,
      subtotal,
      total,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      console.error('Missing customer info:', customerInfo);
      return NextResponse.json(
        { error: "Customer information is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items:', items);
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

          // Allow 0 DA orders for free products, but validate that pricing values are valid numbers
    if (subtotal === undefined || total === undefined || isNaN(parseFloat(subtotal)) || isNaN(parseFloat(total))) {
      console.error('Invalid pricing - not numbers:', { subtotal, total });
      return NextResponse.json(
        { error: "Invalid pricing information - values must be numbers" },
        { status: 400 }
      );
    }

    // Convert to numbers and validate they're not negative
    const subtotalNum = parseFloat(subtotal);
    const totalNum = parseFloat(total);
    
    if (subtotalNum < 0 || totalNum < 0) {
      console.error('Invalid pricing - negative values:', { subtotal: subtotalNum, total: totalNum });
      return NextResponse.json(
        { error: "Pricing cannot be negative" },
        { status: 400 }
      );
    }

    // Handle guest account creation if requested
    let userId = session?.user?.id;
    
    if (!session?.user && customerInfo.createAccount) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: customerInfo.email },
        });

        if (existingUser) {
          console.log('User already exists, linking order to existing account');
          userId = existingUser.id;
        } else {
          // Create new user account
          const randomPassword = generateRandomPassword(8);
          const hashedPassword = await bcrypt.hash(randomPassword, 12);
          
          const newUser = await prisma.user.create({
            data: {
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              email: customerInfo.email,
              password: hashedPassword,
              isActive: true,
              role: "CUSTOMER",
              newsletter: customerInfo.newsletter || false,
            },
          });

          userId = newUser.id;
          
          // Send welcome email with password
          const emailSent = await sendWelcomeEmail(
            customerInfo.firstName,
            customerInfo.email,
            randomPassword
          );
          
          console.log(`New account created for ${customerInfo.email}, email sent: ${emailSent}`);
        }
      } catch (error) {
        console.error('Error creating guest account:', error);
        // Continue with guest checkout even if account creation fails
      }
    }

    // Generate simple order number with collision handling
    let orderNumber: string;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      const orderCount = await prisma.order.count();
      const nextNumber = orderCount + 1 + attempts;
      orderNumber = nextNumber.toString().padStart(6, '0'); // 6-digit number (e.g., 000001)
      
      // Check if this order number already exists
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber },
      });
      
      if (!existingOrder) {
        break; // Order number is unique, we can use it
      }
      
      attempts++;
    } while (attempts < maxAttempts);
    
    // Fallback to timestamp-based if all attempts failed
    if (attempts >= maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      orderNumber = timestamp; // 6-digit timestamp (e.g., 123456)
    }

    // Create the order
    console.log('Creating order with data:', {
      orderNumber,
      userId,
      status: 'PENDING',
      subtotal: subtotalNum,
      total: totalNum,
      itemsCount: items.length,
      customerInfo: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email
      }
    });

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId, // Can be null for guest orders
        status: 'PENDING',
        subtotal: subtotalNum,
        shipping: 0, // No shipping for digital products
        tax: 0, // Tax included in price
        total: totalNum,
        shippingMethod: 'digital', // Digital delivery
        customerNotes: `Customer: ${customerInfo.firstName} ${customerInfo.lastName} (${customerInfo.email})${customerInfo.newsletter ? ' - Newsletter subscribed' : ''}`,
        
        // Create order items
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            name: item.name,
            sku: item.sku || `${item.productId}`,
            price: parseFloat(item.price),
            quantity: item.quantity,
            image: item.image || null,
            variant: item.variant || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log('Order created successfully:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      itemsCount: order.items.length
    });

    // Notify customer about order placement (if authenticated)
    if (userId) {
      try {
        await NotificationService.notifyCustomerOrderPlaced(
          userId,
          order.orderNumber,
          Number(order.total)
        );
        console.log('✅ Customer notification sent successfully');
      } catch (customerNotificationError) {
        console.error('❌ Error sending customer notification:', customerNotificationError);
        // Don't fail the order process if customer notification fails
      }
    }

    // Notify admins about new order
    try {
      console.log('📢 Attempting to send admin notifications for order:', {
        orderNumber: order.orderNumber,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        total: Number(order.total),
        userId: userId || 'guest'
      });
      
      // Prepare items data for notification
      const notificationItems = order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price)
      }));
      
      await NotificationService.notifyAdminNewOrder(
        order.orderNumber,
        `${customerInfo.firstName} ${customerInfo.lastName}`,
        Number(order.total),
        userId || 'guest',
        notificationItems // Pass items data
      );
      
      console.log('✅ Admin notifications sent successfully');
    } catch (adminNotificationError) {
      console.error('❌ Error sending admin notifications:', adminNotificationError);
      console.error('❌ Admin notification error details:', {
        message: adminNotificationError.message,
        stack: adminNotificationError.stack
      });
      // Don't fail the order process if admin notification fails
    }

    // Handle payment processing based on order total
    const isFreeOrder = totalNum === 0;
    let paymentResult;
    
    console.log('Processing payment for order:', {
      orderId: order.id,
      isFreeOrder,
      total: totalNum,
      paymentMethod
    });
    
    try {
      // Process payment (free orders complete immediately, paid orders redirect to gateway)
      paymentResult = await PaymentService.processPayment({
        orderId: order.id,
        amount: totalNum,
        currency: 'DZD',
        paymentMethod: paymentMethod,
        customerInfo: {
          email: customerInfo.email,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName
        },
        successUrl: `${request.headers.get('origin')}/order/success?orderId=${order.id}`,
        cancelUrl: `${request.headers.get('origin')}/checkout?step=payment`
      });

      console.log('Payment processing result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

      // For free orders, complete the order setup immediately
      if (isFreeOrder) {
        console.log('Completing setup for free order:', order.id);
        await completeOrderSetup(order.id, userId || null);
        console.log('Free order setup completed');
      }
      // For paid orders, setup will be completed in the payment confirmation webhook
      
    } catch (error) {
      console.error("Error processing payment:", error);
      // Mark order as failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });
      throw error;
    }

    // Prepare response with payment and auto-login info
    const response: any = {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
      },
      payment: {
        isFree: isFreeOrder,
        requiresRedirect: paymentResult.requiresRedirect || false,
        redirectUrl: paymentResult.redirectUrl,
        transactionId: paymentResult.transactionId,
        message: isFreeOrder 
          ? 'Your order is confirmed. No payment required.' 
          : 'Please complete your payment to confirm the order.'
      }
    };

    // If account was created for guest, provide auto-login info
    if (!session?.user && customerInfo.createAccount && userId) {
      response.autoLogin = {
        email: customerInfo.email,
        userId: userId,
        setupPasswordToken: userId, // Simple token = userId for now
        requiresPasswordSetup: true
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Order creation error:", error);
    
    // Enhanced error logging for guest/authenticated checkout
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id || 'guest',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')
    };
    
    console.error("Detailed error info:", errorDetails);
    
    // Return specific error message if possible
    const errorMessage = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined 
      },
      { status: 500 }
    );
  }
}
