import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { yalidineCreateParcel } from "@/lib/yalidine/client";

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { yalidine: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.paymentMethod !== 'COD') return NextResponse.json({ error: 'Only COD orders supported' }, { status: 400 });
    if (!order.yalidine) return NextResponse.json({ error: 'Missing Yalidine parcel data on order' }, { status: 400 });
    if (order.yalidine.tracking) return NextResponse.json({ error: `Parcel already created (Tracking: ${order.yalidine.tracking})` }, { status: 400 });

    const payload = {
      order_id: order.yalidine.order_id,
      firstname: order.yalidine.firstname,
      familyname: order.yalidine.familyname,
      contact_phone: order.yalidine.contact_phone,
      address: order.yalidine.address,
      to_wilaya_name: order.yalidine.to_wilaya_name,
      to_commune_name: order.yalidine.to_commune_name,
      product_list: order.yalidine.product_list,
      price: order.yalidine.price,
      // Force standard dimensions (1kg weight triggers proper oversize detection)
      height: null,
      width: null,
      length: null,
      weight: 1, // 1 KG for proper oversize handling
      is_stopdesk: order.yalidine.is_stopdesk,
      stopdesk_id: order.yalidine.stopdesk_id || undefined,
      freeshipping: order.yalidine.freeshipping,
      // Keep original exchange setting
      has_exchange: order.yalidine.has_exchange,
      // Force insurance to always be true
      do_insurance: true,
      // Default parcel settings
      parcel_sub_type: null,
      has_receipt: null,
      from_wilaya_name: order.yalidine.from_wilaya_name || undefined,
      from_address: order.yalidine.from_address || undefined,
    } as const;

    console.log('Creating Yalidine parcel with payload:', payload);
    
    const result = await yalidineCreateParcel(payload);
    
    console.log('Yalidine API result:', {
      ok: result.ok,
      data: result.data,
      error: result.error,
      raw: result.raw
    });
    
    // More detailed logging
    console.log('=== YALIDINE API RESPONSE DETAILS ===');
    console.log('✅ Success:', result.ok);
    console.log('📦 Data:', JSON.stringify(result.data, null, 2));
    console.log('❌ Error:', result.error);
    console.log('🔍 Raw Response:', JSON.stringify(result.raw, null, 2));
    console.log('=========================================');

    if (!result.ok || !result.data) {
      console.error('Yalidine parcel creation failed:', result.error);
      return NextResponse.json({ error: result.error || 'Failed to create parcel' }, { status: 400 });
    }

    console.log('Updating database with tracking:', result.data.tracking);

    const updatedParcel = await prisma.yalidineParcel.update({
      where: { orderId: order.id },
      data: {
        tracking: result.data.tracking,
        label_url: result.data.label_url,
        status: result.data.status || 'created',
        lastPayload: {
          request: payload,
          response: result.raw,
          yalidine_api_result: {
            ok: result.ok,
            data: result.data,
            error: result.error,
            tracking_extracted: result.data?.tracking,
          },
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log('Updated parcel in database:', updatedParcel.tracking);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        codStatus: 'SUBMITTED',
        trackingNumber: result.data.tracking || order.trackingNumber,
      },
    });

    console.log('Returning response with tracking:', result.data.tracking);

    return NextResponse.json({ ok: true, tracking: result.data.tracking, label_url: result.data.label_url });
  } catch (error) {
    console.error('Manual Yalidine create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


