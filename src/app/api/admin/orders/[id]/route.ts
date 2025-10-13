import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { summarizeItems } from "@/lib/cart/packing";

// GET - Get order details
export async function GET(
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

    const { id: orderId } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                isVirtual: true,
                images: {
                  select: { url: true }
                }
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        downloads: {
          include: {
            product: {
              select: { name: true, isVirtual: true }
            }
          }
        },
        yalidine: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH - Update order details
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

    const { id: orderId } = await params;
    const body = await request.json();
    
    const {
      customerFirst,
      customerLast,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      shipping,
      tax,
      discount,
      total,
      customerNotes,
      adminNotes,
      shippingAddress,
      shippingMethod,
      trackingNumber,
      estimatedDelivery,
      yalidineOptions
    } = body;

    // Start a transaction to update order and items
    const updatedOrder = await prisma.$transaction(async (tx) => {
      console.log(`🔄 Starting transaction to update order ${orderId}`);
      console.log(`📝 Customer info: ${customerFirst} ${customerLast} - ${customerPhone}`);
      console.log(`💰 Order totals: Subtotal=${subtotal}, Shipping=${shipping}, Tax=${tax}, Discount=${discount}, Total=${total}`);
      console.log(`📦 Items count: ${items.length}`);

      // Update order details (initial write from payload)
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          customerFirst,
          customerLast,
          customerPhone,
          subtotal,
          shipping,
          tax,
          discount,
          total,
          customerNotes,
          adminNotes,
          shippingMethod,
          trackingNumber,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Order ${orderId} updated successfully`);

      // Update shipping address if provided
      if (shippingAddress && order.shippingAddressId) {
        console.log(`🏠 Updating shipping address for order ${orderId}`);
        try {
          await tx.address.update({
            where: { id: order.shippingAddressId },
            data: {
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              company: shippingAddress.company,
              address1: shippingAddress.address1,
              address2: shippingAddress.address2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country,
              phone: shippingAddress.phone,
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Shipping address updated successfully`);
        } catch (addressError) {
          console.log(`⚠️ Could not update shipping address:`, addressError);
        }
      }

      // Update order items
      let itemsUpdated = 0;
      let itemsCreated = 0;
      let itemsDeleted = 0;
      
      console.log(`📦 Processing ${items.length} items for order ${orderId}`);
      console.log(`📦 Items to process:`, items);
      
      // First, get all existing items for this order
      const existingItems = await tx.orderItem.findMany({
        where: { orderId: orderId }
      });
      
      console.log(`📦 Found ${existingItems.length} existing items:`, existingItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })));
      
      // Create a set of existing item IDs for efficient lookup
      const existingItemIds = new Set(existingItems.map(item => item.id));
      
      // Create a set of items to keep (excluding temp items)
      const itemsToKeepIds = new Set(items.filter((item: any) => !item.id.startsWith('temp-')).map((item: any) => item.id));
      
      // Delete items that are no longer in the order
      const itemsToDelete = existingItems.filter((item: any) => !itemsToKeepIds.has(item.id));
      for (const item of itemsToDelete) {
        console.log(`🗑️ Deleting item: ${item.name} (ID: ${item.id})`);
        await tx.orderItem.delete({
          where: { id: item.id }
        });
        itemsDeleted++;
        console.log(`🗑️ Deleted order item: ${item.name} (ID: ${item.id})`);
      }
      
      // Process all items (create new ones, update existing ones)
      for (const item of items) {
        if (item.id.startsWith('temp-')) {
          // This is a new item, create it
          console.log(`➕ Creating new item: ${item.name} x${item.quantity} at price ${item.price}`);
          const newItem = await tx.orderItem.create({
            data: {
              orderId: orderId,
              productId: item.productId || 'temp-product',
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              sku: item.sku || '',
              // Keep COD cents field in sync if relevant
              unitPriceCents: Math.round(Number(item.price) * 100),
            },
          });
          itemsCreated++;
          console.log(`➕ Created new order item: ${item.name} x${item.quantity} (ID: ${newItem.id})`);
        } else {
          // This is an existing item, update it
          console.log(`✏️ Updating existing item: ${item.name} (ID: ${item.id}) - Price: ${item.price}, Quantity: ${item.quantity}`);
          await tx.orderItem.update({
            where: { id: item.id },
            data: {
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              sku: item.sku || '',
              // Keep COD cents field in sync if relevant
              unitPriceCents: Math.round(Number(item.price) * 100),
            },
          });
          itemsUpdated++;
          console.log(`✏️ Updated order item: ${item.name} x${item.quantity} (ID: ${item.id})`);
        }
      }
      
      console.log(`📊 Items processed: ${itemsUpdated} updated, ${itemsCreated} created, ${itemsDeleted} deleted`);
      
      // Verify the items were updated by fetching them again
      const updatedItems = await tx.orderItem.findMany({
        where: { orderId: orderId }
      });
      console.log(`✅ Final items in order:`, updatedItems.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })));

      // Recalculate totals from items to ensure database consistency
      const recalculatedSubtotal = updatedItems.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
      const numericShipping = Number(shipping) || 0;
      const numericTax = Number(tax) || 0;
      const numericDiscount = Number(discount) || 0;
      const recalculatedTotal = recalculatedSubtotal + numericShipping + numericTax - numericDiscount;

      // Persist recalculated totals and sync COD cents fields if applicable
      const isCODOrder = order.paymentMethod === 'COD';
      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: recalculatedSubtotal,
          total: recalculatedTotal,
          ...(isCODOrder ? {
            subtotalCents: Math.round(recalculatedSubtotal * 100),
            totalCents: Math.round(recalculatedTotal * 100),
          } : {}),
          updatedAt: new Date(),
        },
      });

      // If COD and Yalidine parcel exists, ensure collected price is synced with new total (in DA)
      if (isCODOrder) {
        const parcel = await tx.yalidineParcel.findFirst({ where: { orderId: orderId } });
        if (parcel) {
          try {
            // Build concise product list summary for Yalidine
            const productList = summarizeItems(
              updatedItems.map(i => ({ name: i.name, sku: i.sku, quantity: i.quantity }))
            );
            // Extract Yalidine-related edits from payload
            const deliveryType: 'stopdesk' | 'home' | undefined = yalidineOptions?.deliveryType;
            const wilaya: string | undefined = yalidineOptions?.wilaya;
            const commune: string | undefined = yalidineOptions?.commune;
            const freeShipping: boolean | undefined = yalidineOptions?.freeShipping;
            const stopdeskId: number | undefined = yalidineOptions?.stopdeskId;
            const isStopdesk = deliveryType === 'stopdesk';
            const addressFromSelection = (() => {
              if (wilaya && commune) return `${commune}, ${wilaya}`;
              if (wilaya) return wilaya;
              return undefined;
            })();
            await tx.yalidineParcel.update({
              where: { id: parcel.id },
              data: {
                price: Math.round(recalculatedTotal),
                product_list: productList,
                ...(deliveryType ? { is_stopdesk: isStopdesk } : {}),
                ...(typeof stopdeskId === 'number' ? { stopdesk_id: stopdeskId } : {}),
                ...(typeof freeShipping === 'boolean' ? { freeshipping: freeShipping } : {}),
                ...(wilaya ? { to_wilaya_name: wilaya } : {}),
                ...(commune ? { to_commune_name: commune } : {}),
                ...(addressFromSelection ? { address: addressFromSelection } : {}),
                updatedAt: new Date(),
              },
            });
            console.log(`📦 Synced Yalidine price (${Math.round(recalculatedTotal)}) and product list for order ${orderId}`);
          } catch (e) {
            console.log(`⚠️ Failed to sync Yalidine price for order ${orderId}:`, e);
          }
        }
      }

      // Update Yalidine parcel if it exists and customer info changed
      if (customerFirst && customerLast && customerPhone) {
        console.log(`🔍 Checking for Yalidine parcel for order ${orderId}`);
        
        // Try multiple ways to find the Yalidine parcel
        let existingParcel = await tx.yalidineParcel.findFirst({
          where: { orderId: orderId }
        });
        
        // If not found by orderId, try by order_id (some parcels might use this field)
        if (!existingParcel) {
          existingParcel = await tx.yalidineParcel.findFirst({
            where: { order_id: orderId }
          });
          if (existingParcel) {
            console.log(`📦 Found Yalidine parcel by order_id: ${existingParcel.id}`);
          }
        }
        
        // If still not found, try to find by customer info
        if (!existingParcel) {
          existingParcel = await tx.yalidineParcel.findFirst({
            where: {
              OR: [
                { firstname: customerFirst, familyname: customerLast },
                { contact_phone: customerPhone }
              ]
            }
          });
          if (existingParcel) {
            console.log(`📦 Found Yalidine parcel by customer info: ${existingParcel.id}`);
          }
        }

        if (existingParcel) {
          console.log(`📦 Found Yalidine parcel: ${existingParcel.id}`);
          console.log(`📝 Current parcel data: ${existingParcel.firstname} ${existingParcel.familyname} - ${existingParcel.contact_phone}`);
          console.log(`🔄 Updating to: ${customerFirst} ${customerLast} - ${customerPhone}`);
          
          // Update existing parcel
          const updatedParcel = await tx.yalidineParcel.update({
            where: { id: existingParcel.id },
            data: {
              firstname: customerFirst,
              familyname: customerLast,
              contact_phone: customerPhone,
              // Update address fields if shipping address is provided
              ...(shippingAddress && {
                address: `${shippingAddress.address1}${shippingAddress.address2 ? `, ${shippingAddress.address2}` : ''}`,
                to_wilaya_name: shippingAddress.state,
                to_commune_name: shippingAddress.city,
              }),
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Successfully updated Yalidine parcel ${existingParcel.id} for order ${orderId}`);
          console.log(`📝 New parcel data: ${updatedParcel.firstname} ${updatedParcel.familyname} - ${updatedParcel.contact_phone}`);
        } else {
          console.log(`ℹ️ No Yalidine parcel found for order ${orderId}, creating new one...`);
          
          // Create a new Yalidine parcel if none exists
          try {
            const newParcel = await tx.yalidineParcel.create({
              data: {
                orderId: orderId,
                order_id: orderId, // Required field
                firstname: customerFirst,
                familyname: customerLast,
                contact_phone: customerPhone,
                address: shippingAddress ? `${shippingAddress.address1}${shippingAddress.address2 ? `, ${shippingAddress.address2}` : ''}` : 'Address to be updated',
                to_wilaya_name: shippingAddress?.state || 'Wilaya to be updated',
                to_commune_name: shippingAddress?.city || 'Commune to be updated',
                product_list: 'Products to be updated', // Required field
                price: Math.round(total - (order.shipping || 0)), // Send ONLY product total, exclude shipping to avoid double charging
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            console.log(`✅ Created new Yalidine parcel: ${newParcel.id}`);
          } catch (createError) {
            console.log(`⚠️ Could not create Yalidine parcel:`, createError);
          }
        }
      } else {
        console.log(`⚠️ Missing customer info, skipping Yalidine parcel update`);
        console.log(`📝 Customer info: First=${customerFirst}, Last=${customerLast}, Phone=${customerPhone}`);
      }

      return order;
    });

    console.log(`🎉 Order update transaction completed successfully for order ${orderId}`);
    console.log(`📊 Final order data: Customer=${customerFirst} ${customerLast}, Total=${total}, Items=${items.length}`);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Order updated successfully"
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}