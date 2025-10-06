import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== "all") {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        } }
      ];
    }

    // Fetch orders with customer and order items
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              sku: true,
              unitPriceCents: true,
            },
          },
          shippingAddress: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Transform data for frontend
    const transformedOrders = orders.map((order) => {
      // Handle customer information for both authenticated users and guest orders
      let customerInfo;
      if (order.user) {
        // Authenticated user
        customerInfo = {
          firstName: order.user.firstName,
          lastName: order.user.lastName,
          email: order.user.email,
        };
      } else if (order.paymentMethod === 'COD' && order.customerFirst && order.customerLast) {
        // COD order with customer info
        customerInfo = {
          firstName: order.customerFirst,
          lastName: order.customerLast,
          email: order.customerPhone || 'No email', // Use phone as identifier for COD orders
        };
      } else {
        // Guest order - extract from customerNotes or use fallback
        const customerMatch = order.customerNotes?.match(/Customer: (.+?) \((.+?)\)/);
        if (customerMatch) {
          const [fullName, email] = customerMatch.slice(1);
          const [firstName, lastName] = fullName.split(' ');
          customerInfo = {
            firstName: firstName || 'Guest',
            lastName: lastName || 'Customer',
            email: email || 'guest@example.com',
          };
        } else {
          customerInfo = {
            firstName: 'Guest',
            lastName: 'Customer',
            email: 'guest@example.com',
          };
        }
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: customerInfo,
        status: order.paymentMethod === 'COD' ? order.codStatus : order.status, // Use codStatus for COD orders
        total: order.total,
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        // Include item details for better display
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priceCents: item.unitPriceCents ?? undefined,
          quantity: item.quantity,
          sku: item.sku,
        })),
        // Calculate subtotal from actual items for accuracy
        subtotal: order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0),
        subtotalCents: typeof order.subtotalCents === 'number' ? order.subtotalCents : undefined,
        // Include shipping costs
        shipping: order.shipping || 0,
        shippingCents: order.shippingCents || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        shippingAddress: order.shippingAddress,
        // COD-specific fields
        paymentMethod: order.paymentMethod,
        codStatus: order.codStatus,
        totalCents: order.totalCents,
        customerFirst: order.customerFirst,
        customerLast: order.customerLast,
        customerPhone: order.customerPhone,
        // Additional fields for debugging
        isGuest: !order.user,
        customerNotes: order.customerNotes,
        currency: order.currency, // Include currency for proper formatting
      };
    });

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
