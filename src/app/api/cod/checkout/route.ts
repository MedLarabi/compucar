import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from '@/lib/auth/config';
import { prisma } from "@/lib/database/prisma";
import { yalidineCreateParcel, CreateParcelInput, yalidineGetWilayas, yalidineGetCommunes, yalidineCalculateShipping } from "@/lib/yalidine/client";
import { summarizeItems, computeParcel, applyParcelOverrides, validatePhysicalItems } from "@/lib/cart/packing";
import { NotificationService } from "@/lib/services/notifications";

export const runtime = 'nodejs';

const cartItemSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  sku: z.string().optional(),
  unitPriceCents: z.number().min(0),
  quantity: z.number().min(1),
  weightGr: z.number().min(1),
  lengthCm: z.number().optional(),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),
});

const checkoutSchema = z.object({
  cart: z.array(cartItemSchema).min(1),
  customer: z.object({
    firstname: z.string().min(1),
    familyname: z.string().min(1),
    phone: z.string().regex(/^[0-9]{9,10}$/, "Phone must be 9-10 digits"),
  }),
  destination: z.object({
    wilaya: z.string().min(1),
    commune: z.string().optional(),
  }),
  delivery: z.object({
    isStopdesk: z.boolean(),
    stopdeskId: z.number().optional(),
    freeshipping: z.boolean().optional().default(false),
    hasExchange: z.boolean().optional().default(false),
  }),
  parcelOverride: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
  }).optional(),
  notes: z.string().optional(),
  calculatedShipping: z.number().optional().default(0), // Shipping cost calculated on frontend
}).refine((data) => {
  // For home delivery, commune is required
  if (!data.delivery.isStopdesk && (!data.destination.commune || data.destination.commune.trim().length === 0)) {
    return false;
  }
  // For stop desk delivery, stopdeskId is required
  if (data.delivery.isStopdesk && (!data.delivery.stopdeskId || data.delivery.stopdeskId <= 0)) {
    return false;
  }
  return true;
}, {
  message: "For home delivery, commune is required. For stop desk delivery, valid stopdeskId is required.",
  path: ["delivery"]
});

type CheckoutData = z.infer<typeof checkoutSchema>;

export async function POST(request: NextRequest) {
  try {
    console.log('COD checkout request received');

    // Check if user is authenticated
    const session = await auth();
    console.log('COD checkout session:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    const data: CheckoutData = checkoutSchema.parse(body);

    // Validate address using local DB cache first, then remote as fallback
    let validAddress = false;
    let exactWilayaName = '';
    let exactCommuneName = '';
    
    try {
      const dbWilaya = await prisma.wilaya.findFirst({
        where: { nameFr: { equals: data.destination.wilaya, mode: 'insensitive' }, active: true },
        select: { id: true, nameFr: true },
      });
      if (dbWilaya) {
        exactWilayaName = dbWilaya.nameFr; // Use exact name from DB
        
        // For stop desk delivery, we need to find the commune where stop desk is located
        if (data.delivery.isStopdesk) {
          if (data.delivery.stopdeskId) {
            // Look up the stop desk to get its commune
            const stopDesk = await prisma.stopDesk.findFirst({
              where: { id: data.delivery.stopdeskId, active: true },
              include: { wilaya: true }
            });
            
            if (stopDesk) {
              // For stop desk, find the main commune (usually same name as wilaya)
              // First try to find commune with same name as wilaya
              let mainCommune = await prisma.commune.findFirst({
                where: { 
                  wilayaId: stopDesk.wilayaId, 
                  active: true,
                  nameFr: { equals: stopDesk.wilaya.nameFr, mode: 'insensitive' }
                }
              });
              
              // If no exact match, try to find the capital/main commune
              if (!mainCommune) {
                mainCommune = await prisma.commune.findFirst({
                  where: { 
                    wilayaId: stopDesk.wilayaId, 
                    active: true,
                  },
                  orderBy: [
                    { nameFr: 'asc' } // Get first commune alphabetically as fallback
                  ]
                });
              }
              
              if (mainCommune) {
                exactCommuneName = mainCommune.nameFr;
                validAddress = true;
                console.log(`Using commune '${exactCommuneName}' for stop desk ${data.delivery.stopdeskId} in ${stopDesk.wilaya.nameFr}`);
              } else {
                // Final fallback: use wilaya name as commune name
                exactCommuneName = exactWilayaName;
                validAddress = true;
                console.log(`Fallback: using wilaya name '${exactCommuneName}' as commune for stop desk ${data.delivery.stopdeskId}`);
              }
            }
          }
        } else {
          // For home delivery, we need both wilaya and commune
          const dbCommune = await prisma.commune.findFirst({
            where: {
              wilayaId: dbWilaya.id,
              nameFr: { equals: data.destination.commune, mode: 'insensitive' },
              active: true,
            },
            select: { id: true, nameFr: true },
          });
          if (dbCommune) {
            exactCommuneName = dbCommune.nameFr; // Use exact name from DB
            validAddress = true;
          }
        }
      }
    } catch {}

    if (!validAddress) {
      // Fallback to remote/mocked API validation
      const wilayasResult = await yalidineGetWilayas();
      if (wilayasResult.ok && wilayasResult.data) {
        const matchedWilaya = wilayasResult.data.find(
          (w) => w.name.toLowerCase() === data.destination.wilaya.toLowerCase()
        );
        if (matchedWilaya) {
          exactWilayaName = matchedWilaya.name; // Use exact API name
          
          // For stop desk delivery, use wilaya name as commune name
          if (data.delivery.isStopdesk) {
            exactCommuneName = exactWilayaName; // Use wilaya name as commune for stop desk
            validAddress = true;
          } else {
            // For home delivery, we need both wilaya and commune
            const communesResult = await yalidineGetCommunes(exactWilayaName);
            if (communesResult.ok && communesResult.data) {
              const matchedCommune = communesResult.data.find(
                (commune) => commune.name.toLowerCase() === data.destination.commune?.toLowerCase()
              );
              if (matchedCommune) {
                exactCommuneName = matchedCommune.name; // Use exact API name
                validAddress = true;
              }
            }
          }
        }
      }
    }

    if (!validAddress) {
      const errorMessage = data.delivery.isStopdesk 
        ? "Invalid or unavailable wilaya for stop desk delivery"
        : "Invalid or unavailable wilaya/commune";
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Validate physical items
    const validation = validatePhysicalItems(data.cart);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid items", details: validation.errors },
        { status: 400 }
      );
    }

    // Validate that all products exist in the database
    const productIds = data.cart.map(item => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, price: true }
    });
    
    if (existingProducts.length !== productIds.length) {
      const existingProductIds = existingProducts.map(p => p.id);
      const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));
      
      console.error('Missing products:', missingProductIds);
      return NextResponse.json(
        { 
          error: "Some products are no longer available", 
          details: { missingProducts: missingProductIds }
        },
        { status: 400 }
      );
    }

    // Update cart data with current product information
    const updatedCartData = data.cart.map(cartItem => {
      const dbProduct = existingProducts.find(p => p.id === cartItem.productId);
      if (dbProduct) {
        return {
          ...cartItem,
          name: dbProduct.name, // Use current product name
          unitPriceCents: Math.round(Number(dbProduct.price) * 100), // Use current price
        };
      }
      return cartItem;
    });

    // Normalize phone number (remove spaces, keep digits only)
    const cleanPhone = data.customer.phone.replace(/\D/g, '');

    // Calculate totals using updated cart data
    const subtotalCents = updatedCartData.reduce((sum, item) => 
      sum + (item.unitPriceCents * item.quantity), 0
    );

    // Use the shipping cost that was calculated and shown to the customer during checkout
    const shippingCents = Math.round((data.calculatedShipping || 0) * 100); // Convert DA to cents
    
    console.log('📦 Using pre-calculated shipping cost:', {
      shippingDA: data.calculatedShipping,
      shippingCents: shippingCents,
      source: 'frontend_calculation'
    });

    const totalCents = subtotalCents + shippingCents;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `COD-${String(orderCount + 1).padStart(6, '0')}`;

    // Compute parcel dimensions
    const computedParcel = computeParcel(updatedCartData);
    const finalParcel = applyParcelOverrides(computedParcel, data.parcelOverride);

    // Create product list summary
    const productList = summarizeItems(updatedCartData);

    console.log('Creating COD order:', {
      orderNumber,
      customer: `${data.customer.firstname} ${data.customer.familyname}`,
      destination: data.delivery.isStopdesk 
        ? `Stop Desk ${data.delivery.stopdeskId} in ${exactCommuneName}, ${exactWilayaName || data.destination.wilaya}`
        : `${exactCommuneName || data.destination.commune}, ${exactWilayaName || data.destination.wilaya}`,
      deliveryType: data.delivery.isStopdesk ? 'StopDesk' : 'Home Delivery',
      totalCents,
      itemCount: data.cart.length
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null, // Associate with logged-in user if available
        status: 'PENDING', // Ensure regular status starts as PENDING
        paymentMethod: 'COD',
        codStatus: 'PENDING',
        subtotalCents,
        shippingCents,
        totalCents,
        currency: 'DZD',
        customerFirst: data.customer.firstname,
        customerLast: data.customer.familyname,
        customerPhone: cleanPhone,
        customerNotes: data.notes,
        
        // Legacy fields (set to reasonable defaults)
        subtotal: subtotalCents / 100,
        shipping: shippingCents / 100,
        total: totalCents / 100,
        shippingMethod: data.delivery.isStopdesk ? 'StopDesk' : 'Home Delivery',
        
        items: {
          create: updatedCartData.map(item => ({
            productId: item.productId,
            name: item.name,
            sku: item.sku || '',
            price: item.unitPriceCents / 100, // legacy field in decimal
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            weightGr: item.weightGr,
            lengthCm: item.lengthCm,
            widthCm: item.widthCm,
            heightCm: item.heightCm,
          }))
        },
        
        yalidine: {
          create: {
            order_id: orderNumber,
            firstname: data.customer.firstname,
            familyname: data.customer.familyname,
            contact_phone: cleanPhone,
            address: data.delivery.isStopdesk 
              ? `Stop Desk ${data.delivery.stopdeskId}, ${exactCommuneName}, ${exactWilayaName || data.destination.wilaya}`
              : `${exactCommuneName || data.destination.commune}, ${exactWilayaName || data.destination.wilaya}`,
            to_wilaya_name: exactWilayaName || data.destination.wilaya,
            to_commune_name: exactCommuneName || data.destination.commune || '',
            is_stopdesk: data.delivery.isStopdesk,
            stopdesk_id: data.delivery.stopdeskId,
            freeshipping: data.delivery.freeshipping || false,
            has_exchange: data.delivery.hasExchange || false,
            product_list: productList,
            price: Math.round(totalCents / 100), // Convert to DZD (no decimals)
            // Force dimensions to standard values (1kg weight triggers proper oversize detection)
            height: null,
            width: null,
            length: null,
            weight: 1, // 1 KG for proper oversize handling
            from_wilaya_name: process.env.DEFAULT_FROM_WILAYA_NAME || 'Alger',
            from_address: process.env.DEFAULT_FROM_ADDRESS || 'Zone Industrielle, Alger',
          }
        }
      },
      include: {
        yalidine: true,
        items: true
      }
    });

    console.log('Order created successfully:', order.id);

    // Send notifications for the new COD order
    try {
      console.log('📢 Attempting to send admin notifications for COD order:', {
        orderNumber: order.orderNumber,
        customerName: `${data.customer.firstname} ${data.customer.familyname}`,
        total: totalCents / 100,
        customerId: 'guest' // COD orders are guest orders
      });
      
      // Prepare items data for notification
      const notificationItems = updatedCartData.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPriceCents / 100 // Convert cents to DA
      }));
      
      await NotificationService.notifyAdminNewOrder(
        order.orderNumber,
        `${data.customer.firstname} ${data.customer.familyname}`,
        totalCents / 100, // Convert cents to DA
        session?.user?.id || 'guest', // Use actual user ID if logged in
        notificationItems // Pass items data
      );
      
      console.log('✅ COD order admin notifications sent successfully');
    } catch (adminNotificationError) {
      console.error('❌ Error sending COD order admin notifications:', adminNotificationError);
      console.error('❌ COD admin notification error details:', {
        message: adminNotificationError.message,
        stack: adminNotificationError.stack
      });
      // Don't fail the order process if admin notification fails
    }

    // Send customer notification if user is logged in
    if (session?.user?.id) {
      try {
        console.log('📧 Sending customer notification for COD order...');
        await NotificationService.notifyCustomerOrderPlaced(
          session.user.id,
          order.orderNumber,
          totalCents / 100 // Convert cents to DA
        );
        console.log('✅ COD order customer notification sent successfully');
      } catch (customerNotificationError) {
        console.error('❌ Error sending COD order customer notification:', customerNotificationError);
        // Don't fail the order process if customer notification fails
      }
    } else {
      console.log('ℹ️ Skipping customer notification - order placed as guest');
    }

    // Prepare Yalidine payload
    const yalidinePayload: CreateParcelInput = {
      order_id: order.yalidine!.order_id,
      firstname: order.yalidine!.firstname,
      familyname: order.yalidine!.familyname,
      contact_phone: order.yalidine!.contact_phone,
      address: order.yalidine!.address,
      to_wilaya_name: order.yalidine!.to_wilaya_name,
      to_commune_name: order.yalidine!.to_commune_name,
      product_list: order.yalidine!.product_list,
      price: order.yalidine!.price,
      // Force oversize to false (no custom dimensions)
      height: null,
      width: null,
      length: null,
      weight: null,
      is_stopdesk: order.yalidine!.is_stopdesk,
      stopdesk_id: order.yalidine!.stopdesk_id || undefined,
      freeshipping: order.yalidine!.freeshipping,
      // Keep original exchange setting
      has_exchange: order.yalidine!.has_exchange,
      // Force insurance to always be true
      do_insurance: true,
      // Default parcel settings
      parcel_sub_type: null,
      has_receipt: null,
      from_wilaya_name: order.yalidine!.from_wilaya_name || undefined,
      from_address: order.yalidine!.from_address || undefined,
    };

    let yalidineResult = null;
    let finalCodStatus = 'PENDING';

    // Check if auto-create is enabled
    const autoCreate = false; // Disabled during order creation to keep orders in PENDING
    
    if (autoCreate) {
      console.log('Auto-creating Yalidine parcel...');
      
      yalidineResult = await yalidineCreateParcel(yalidinePayload);
      
      if (yalidineResult.ok && yalidineResult.data) {
        // Update order with tracking info
        await prisma.yalidineParcel.update({
          where: { orderId: order.id },
          data: {
            tracking: yalidineResult.data.tracking,
            label_url: yalidineResult.data.label_url,
            status: yalidineResult.data.status,
            lastPayload: {
              request: yalidinePayload,
              response: yalidineResult.raw,
              timestamp: new Date().toISOString()
            }
          }
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { 
            codStatus: 'SUBMITTED',
            trackingNumber: yalidineResult.data.tracking 
          }
        });

        finalCodStatus = 'SUBMITTED';
        console.log('Yalidine parcel created:', yalidineResult.data.tracking);
      } else {
        console.error('Failed to create Yalidine parcel:', yalidineResult.error);
        // Store the error but don't fail the order
        await prisma.yalidineParcel.update({
          where: { orderId: order.id },
          data: {
            lastPayload: {
              request: yalidinePayload,
              error: yalidineResult.error,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    }

    const response = {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      codStatus: finalCodStatus,
      pricing: {
        subtotal: subtotalCents / 100,
        shipping: shippingCents / 100,
        total: totalCents / 100,
        currency: 'DZD'
      },
      yalidine: {
        payload: yalidinePayload,
        tracking: yalidineResult?.data?.tracking,
        label_url: yalidineResult?.data?.label_url,
        status: yalidineResult?.data?.status,
        error: yalidineResult?.error
      }
    };

    console.log('COD checkout completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error('COD checkout error:', error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
