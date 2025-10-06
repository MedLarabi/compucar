import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Try to get session (optional for COD orders)
    const session = await auth();
    
    // Build where clause - ensure user can only access their own orders
    const whereClause: any = { id: orderId };
    
    // If user is logged in, filter by userId
    if (session?.user?.id) {
      whereClause.userId = session.user.id;
    } else {
      // Not logged in - only allow COD guest orders (userId is null)
      whereClause.AND = [
        { paymentMethod: 'COD' },
        { userId: null }
      ];
    }
    
    // Fetch the order with all related data
    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            name: true,
            sku: true,
            quantity: true,
            unitPriceCents: true,
            price: true, // legacy field for compatibility
            image: true,
            variant: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        payments: {
          select: {
            id: true,
            method: true,
            status: true,
            transactionId: true,
            amount: true,
            paidAt: true,
          }
        },
        yalidine: {
          select: {
            tracking: true,
            status: true,
            label_url: true,
            to_wilaya_name: true,
            to_commune_name: true,
            is_stopdesk: true,
            stopdesk_id: true,
            price: true,
            product_list: true,
            lastPayload: true,
            order_id: true,
            firstname: true,
            familyname: true,
            contact_phone: true,
            address: true,
            height: true,
            width: true,
            length: true,
            weight: true,
            freeshipping: true,
            has_exchange: true,
            from_wilaya_name: true,
            from_address: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ 
        success: false,
        error: 'Order not found' 
      }, { status: 404 });
    }

    // Return consistent format for all orders
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      // For COD orders, use codStatus as the display status
      displayStatus: order.paymentMethod === 'COD' ? (order.codStatus || 'PENDING') : order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerNotes: order.customerNotes,
      shippingMethod: order.shippingMethod,
      
      // Handle pricing fields - COD orders use cents, regular orders use decimal
      subtotal: order.paymentMethod === 'COD' ? (order.subtotalCents || 0) / 100 : Number(order.subtotal || 0),
      shipping: order.paymentMethod === 'COD' ? (order.shippingCents || 0) / 100 : Number(order.shipping || 0),
      tax: Number(order.tax || 0),
      total: order.paymentMethod === 'COD' ? (order.totalCents || 0) / 100 : Number(order.total || 0),
      
      // Customer information
      customerFirst: order.customerFirst,
      customerLast: order.customerLast,
      customerPhone: order.customerPhone,
      
      // COD specific fields
      codStatus: order.codStatus,
      currency: order.currency || 'DZD',
      
      // Order items with proper pricing
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: order.paymentMethod === 'COD' ? (item.unitPriceCents || 0) / 100 : Number(item.price || 0),
        sku: item.sku || '',
        image: item.image,
        variant: item.variant,
        productId: item.productId
      })),
      
      // User information (if available)
      user: order.user,
      
      // Payment information
      payments: order.payments?.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })) || [],
      
      // Yalidine shipping information (for COD orders) - Enhanced with tracking
      yalidine: order.yalidine,
      tracking: order.yalidine?.tracking || null,
      trackingStatus: order.yalidine?.status || null,
      shippingInfo: order.yalidine ? {
        wilaya: order.yalidine.to_wilaya_name,
        commune: order.yalidine.to_commune_name,
        isStopdesk: order.yalidine.is_stopdesk,
        shippingCost: order.yalidine.price,
        address: order.yalidine.address,
      } : null,
    };

    return NextResponse.json({
      success: true,
      order: orderData
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}