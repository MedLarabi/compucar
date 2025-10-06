import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { yalidineUpdateParcel, type CreateParcelInput } from "@/lib/yalidine/client";

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { yalidine: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.paymentMethod !== 'COD') return NextResponse.json({ error: 'Only COD orders supported' }, { status: 400 });
    if (!order.yalidine) return NextResponse.json({ error: 'No Yalidine parcel data found' }, { status: 400 });
    if (!order.yalidine.tracking) return NextResponse.json({ error: 'No existing parcel to update' }, { status: 400 });

    // Validate and get exact wilaya/commune names from database
    let exactWilayaName = order.yalidine.to_wilaya_name;
    let exactCommuneName = order.yalidine.to_commune_name;
    
    // Check if we have empty or invalid wilaya/commune names
    if (!exactWilayaName || !exactCommuneName) {
      console.error('Order has empty wilaya/commune names:', {
        orderId: order.id,
        to_wilaya_name: `"${order.yalidine.to_wilaya_name}"`,
        to_commune_name: `"${order.yalidine.to_commune_name}"`
      });
      return NextResponse.json({ 
        error: 'This order has invalid wilaya/commune data. Please fix the address first.',
        details: {
          current_wilaya: order.yalidine.to_wilaya_name,
          current_commune: order.yalidine.to_commune_name,
          solution: 'Use the "Fix Address" button or API endpoint to set valid wilaya/commune data first.'
        }
      }, { status: 400 });
    }
    
    try {
      const dbWilaya = await prisma.wilaya.findFirst({
        where: { nameFr: { equals: order.yalidine.to_wilaya_name, mode: 'insensitive' }, active: true },
        select: { id: true, nameFr: true },
      });
      if (dbWilaya) {
        exactWilayaName = dbWilaya.nameFr; // Use exact name from DB
        const dbCommune = await prisma.commune.findFirst({
          where: {
            wilayaId: dbWilaya.id,
            nameFr: { equals: order.yalidine.to_commune_name, mode: 'insensitive' },
            active: true,
          },
          select: { id: true, nameFr: true },
        });
        if (dbCommune) {
          exactCommuneName = dbCommune.nameFr; // Use exact name from DB
        } else {
          console.warn('Commune not found in DB, using original name:', order.yalidine.to_commune_name);
        }
      } else {
        console.warn('Wilaya not found in DB, using original name:', order.yalidine.to_wilaya_name);
      }
    } catch (e) {
      console.warn('Could not validate wilaya/commune names:', e);
    }

    // Prepare updated payload with exact names (only PATCH-supported parameters)
    const payload = {
      order_id: order.yalidine.order_id,
      firstname: order.yalidine.firstname,
      familyname: order.yalidine.familyname,
      contact_phone: order.yalidine.contact_phone,
      address: order.yalidine.address,
      to_wilaya_name: exactWilayaName,
      to_commune_name: exactCommuneName,
      product_list: order.yalidine.product_list,
      price: order.yalidine.price,
      // Dimensions (null values will be omitted by yalidineUpdateParcel)
      height: null,
      width: null,
      length: null,
      weight: 1, // 1 KG for proper oversize handling
      is_stopdesk: order.yalidine.is_stopdesk,
      stopdesk_id: order.yalidine.stopdesk_id || undefined,
      freeshipping: order.yalidine.freeshipping,
      has_exchange: order.yalidine.has_exchange,
      do_insurance: true,
      from_wilaya_name: order.yalidine.from_wilaya_name || undefined,
      // Note: from_address might not be supported in PATCH, check if needed
      // Removed: parcel_sub_type, has_receipt (not supported in PATCH API)
    } as const;

    // Use Yalidine's PATCH API to update the existing parcel
    console.log('Updating Yalidine parcel via PATCH API:', {
      tracking: order.yalidine.tracking,
      updates: Object.keys(payload)
    });
    
    const result = await yalidineUpdateParcel(order.yalidine.tracking, payload);
    
    console.log('Yalidine update result:', {
      ok: result.ok,
      data: result.data,
      error: result.error,
      tracking: order.yalidine.tracking
    });

    if (!result.ok || !result.data) {
      console.error('Yalidine parcel update failed:', result.error);
            const errorMessage = typeof result.error === 'string'
        ? result.error
        : (result.error as any)?.message || 'Failed to update parcel';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Update local database with updated parcel data
    await prisma.yalidineParcel.update({
      where: { orderId: order.id },
      data: {
        // Keep the same tracking number (PATCH doesn't change it)
        label_url: result.data.label_url || order.yalidine.label_url,
        status: result.data.status || 'updated',
        // Update with current order data from the payload (using exact names)
        firstname: payload.firstname || order.yalidine.firstname,
        familyname: payload.familyname || order.yalidine.familyname,
        contact_phone: payload.contact_phone || order.yalidine.contact_phone,
        address: payload.address || order.yalidine.address,
        to_wilaya_name: exactWilayaName, // Use validated exact name
        to_commune_name: exactCommuneName, // Use validated exact name
        product_list: payload.product_list || order.yalidine.product_list,
        price: payload.price || order.yalidine.price,
        lastPayload: {
          action: 'update_patch',
          request: payload,
          response: result.raw,
          tracking: order.yalidine.tracking,
          timestamp: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      ok: true, 
      message: 'Parcel updated successfully via Yalidine API',
      tracking: order.yalidine.tracking,
      label_url: result.data.label_url || order.yalidine.label_url,
      updated_fields: Object.keys(payload)
    });
  } catch (error) {
    console.error('Yalidine update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
