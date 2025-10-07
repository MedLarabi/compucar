import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import { auth } from '@/lib/auth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                isVirtual: true,
              }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        yalidine: true,
        downloads: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              }
            }
          }
        },
        assignedLicenseKeys: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              }
            }
          }
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if user can access this order
    // Allow access if:
    // 1. User is logged in and owns the order
    // 2. User is admin/super-admin
    // 3. Order is accessed within 24 hours of creation (for guest orders)
    const canAccess = 
      (session?.user?.id === order.userId) || 
      (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') ||
      (!order.userId && isRecentOrder(order.createdAt));

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Transform the data for the frontend
    const transformedOrder = {
      ...order,
      // Ensure price fields are properly serialized
      subtotal: order.subtotal ? Number(order.subtotal) : 0,
      shipping: order.shipping ? Number(order.shipping) : 0,
      tax: order.tax ? Number(order.tax) : 0,
      discount: order.discount ? Number(order.discount) : 0,
      total: order.total ? Number(order.total) : 0,
      
      // Transform order items
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
      })),
      
      // Transform payments
      payments: order.payments?.map(payment => ({
        ...payment,
        amount: Number(payment.amount),
      })) || [],
      
      // Transform license keys (decrypt if needed)
      licenseKeys: order.assignedLicenseKeys?.map(license => ({
        id: license.id,
        keyValue: license.keyValue,
        decryptedKey: license.encryptedKey || license.keyValue, // Fallback if not encrypted
        product: license.product,
        assignedAt: license.assignedAt,
      })) || [],
    };

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    });

  } catch (error) {
    console.error('Error fetching complete order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

// Helper function to check if order is recent (within 24 hours)
function isRecentOrder(createdAt: Date): boolean {
  const now = new Date();
  const orderTime = new Date(createdAt);
  const diffInHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
}
