import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { updateOrderStatusSchema } from "@/lib/schemas/order-schema";
import { yalidineCreateParcel } from "@/lib/yalidine/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateOrderStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Check if order exists and include Yalidine data for COD orders
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        yalidine: true, // Include Yalidine parcel data
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Determine if this is a COD order and which field to update
    const isCODOrder = existingOrder.paymentMethod === 'COD';
    
    // Map regular order statuses to COD statuses
    const mapToCODStatus = (regularStatus: string): string => {
      switch (regularStatus) {
        case 'PENDING': return 'PENDING';
        case 'CONFIRMED': return 'SUBMITTED'; // Confirmed means ready to send to courier
        case 'SHIPPED': return 'DISPATCHED'; // Shipped means package is out for delivery
        case 'DELIVERED': return 'DELIVERED';
        case 'CANCELLED': return 'CANCELLED';
        case 'REFUNDED': return 'CANCELLED'; // Refunded orders are cancelled
        case 'SUBMITTED': return 'SUBMITTED'; // Direct mapping for COD workflow
        case 'DISPATCHED': return 'DISPATCHED';
        case 'FAILED': return 'FAILED';
        default: return 'PENDING';
      }
    };
    
    // For COD orders, update codStatus with mapped value; for regular orders, update status
    const finalStatus = isCODOrder ? mapToCODStatus(status) : status;
    console.log(`Updating order ${existingOrder.orderNumber}: input="${status}" → final="${finalStatus}" (COD: ${isCODOrder})`);
    
    // Update order status
    if (isCODOrder) {
      await prisma.order.update({
        where: { id },
        data: { 
          codStatus: finalStatus as any,
          updatedAt: new Date() 
        },
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { 
          status: finalStatus as any,
          updatedAt: new Date() 
        },
      });
    }

    // Fetch updated order with includes
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
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
            quantity: true,
          },
        },
        shippingAddress: true,
        yalidine: true,
      },
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found after update" }, { status: 404 });
    }

    // Auto-create Yalidine parcel for COD orders when moving to CONFIRMED / SUBMITTED / SHIPPED
    if (isCODOrder && existingOrder.yalidine && !existingOrder.yalidine.tracking) {
      const finalCODStatus = mapToCODStatus(status);
      const shouldCreate = finalCODStatus === 'SUBMITTED' || finalCODStatus === 'DISPATCHED';
      if (shouldCreate) {
        try {
          console.log(`Auto-creating Yalidine parcel for COD order ${existingOrder.orderNumber}`);
          
          // Check if auto-creation is enabled
          const autoCreateEnabled = process.env.YALIDINE_ENABLE_AUTO_CREATE === 'true';
          
          if (autoCreateEnabled) {
            // Prepare Yalidine payload from existing parcel data
            const yalidinePayload = {
              order_id: existingOrder.yalidine.order_id,
              firstname: existingOrder.yalidine.firstname,
              familyname: existingOrder.yalidine.familyname,
              contact_phone: existingOrder.yalidine.contact_phone,
              address: existingOrder.yalidine.address,
              to_wilaya_name: existingOrder.yalidine.to_wilaya_name,
              to_commune_name: existingOrder.yalidine.to_commune_name,
              product_list: existingOrder.yalidine.product_list,
              price: existingOrder.yalidine.price,
              // Force standard dimensions (1kg weight triggers proper oversize detection)
              height: null,
              width: null,
              length: null,
              weight: 1, // 1 KG for proper oversize handling
              is_stopdesk: existingOrder.yalidine.is_stopdesk,
              stopdesk_id: existingOrder.yalidine.stopdesk_id || undefined,
              freeshipping: existingOrder.yalidine.freeshipping,
              // Keep original exchange setting
              has_exchange: existingOrder.yalidine.has_exchange,
              // Force insurance to always be true
              do_insurance: true,
              // Default parcel settings
              parcel_sub_type: null,
              has_receipt: null,
              from_wilaya_name: existingOrder.yalidine.from_wilaya_name || undefined,
              from_address: existingOrder.yalidine.from_address || undefined,
            };

            // Create parcel with Yalidine API
            const yalidineResult = await yalidineCreateParcel(yalidinePayload);
            
            if (yalidineResult.ok && yalidineResult.data) {
              // Update the Yalidine parcel record with tracking info
              await prisma.yalidineParcel.update({
                where: { orderId: existingOrder.id },
                data: {
                  tracking: yalidineResult.data.tracking,
                  label_url: yalidineResult.data.label_url,
                  status: yalidineResult.data.status || 'created',
                  lastPayload: {
                    request: yalidinePayload,
                    response: yalidineResult.raw,
                    timestamp: new Date().toISOString(),
                  },
                  updatedAt: new Date(),
                },
              });

              console.log(`✅ Yalidine parcel created successfully for order ${existingOrder.orderNumber}:`, yalidineResult.data.tracking);
            } else {
              console.error(`❌ Failed to create Yalidine parcel for order ${existingOrder.orderNumber}:`, yalidineResult.error);
            }
          } else {
            console.log(`ℹ️ Auto-creation disabled for order ${existingOrder.orderNumber}. Set YALIDINE_ENABLE_AUTO_CREATE=true to enable.`);
          }
        } catch (yalidineError) {
          console.error(`❌ Yalidine auto-creation error for order ${existingOrder.orderNumber}:`, yalidineError);
          // Don't fail the status update if Yalidine fails
        }
      }
    }

    // TODO: Send email notification to customer about status change
    // TODO: Log the status change for audit purposes

    return NextResponse.json({
      message: "Order status updated successfully",
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customer: updatedOrder.user,
        status: isCODOrder ? updatedOrder.codStatus : updatedOrder.status,
        total: isCODOrder ? (updatedOrder.totalCents ? updatedOrder.totalCents / 100 : 0) : updatedOrder.total,
        itemsCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: updatedOrder.createdAt.toISOString(),
        updatedAt: updatedOrder.updatedAt.toISOString(),
        shippingAddress: updatedOrder.shippingAddress,
        paymentMethod: updatedOrder.paymentMethod,
        yalidine: updatedOrder.yalidine ? {
          tracking: updatedOrder.yalidine.tracking,
          status: updatedOrder.yalidine.status,
          created: !!updatedOrder.yalidine.tracking,
        } : null,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
