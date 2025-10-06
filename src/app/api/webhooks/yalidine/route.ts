import { NextRequest, NextResponse } from "next/server";
import { YalidineService, YalidineWebhookPayload } from "@/lib/services/yalidine-service";
import { prisma } from "@/lib/database/prisma";
import crypto from "node:crypto";
import { setImmediate as defer } from "node:timers";

/**
 * Yalidine Webhook Endpoint
 * This endpoint receives delivery status updates from Yalidine
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/yalidine
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Yalidine webhook received');

    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: YalidineWebhookPayload;

    try {
      const raw = JSON.parse(rawBody);
      // Normalize various possible Yalidine webhook shapes into our internal type
      // Official docs may send fields like: status, tracking (or tracking_number), order_id
      // Also support our existing typed structure
      const status = raw?.status || raw?.parcel?.status;
      const tracking = raw?.tracking || raw?.tracking_number || raw?.parcel?.tracking_number;
      const orderId = raw?.order_id || raw?.parcel?.order_id;
      const event = raw?.event || (typeof status === 'string' ? `parcel.${status}` : undefined);

      if (status && tracking) {
        payload = {
          event: event || 'parcel.updated',
          parcel: {
            id: raw?.parcel?.id || raw?.id || tracking,
            tracking_number: tracking,
            status: status,
            order_id: orderId || '',
            recipient: raw?.parcel?.recipient || {
              name: raw?.recipient_name || '',
              phone: raw?.recipient_phone || '',
              address: raw?.recipient_address || '',
              commune: raw?.to_commune_name || '',
              wilaya: raw?.to_wilaya_name || '',
            },
            items: raw?.parcel?.items || [],
            cash_on_delivery: raw?.cash_on_delivery ?? 0,
            shipping_cost: raw?.shipping_cost ?? 0,
            total_amount: raw?.total_amount ?? 0,
            created_at: raw?.created_at || new Date().toISOString(),
            updated_at: raw?.updated_at || new Date().toISOString(),
          },
          timestamp: raw?.timestamp || new Date().toISOString(),
          signature: raw?.signature,
        };
      } else {
        payload = raw as YalidineWebhookPayload;
      }
    } catch (parseError) {
      console.error('Invalid JSON payload:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify webhook signature (docs: X_YALIDINE_SIGNATURE = HMAC-SHA256(payload, secret_key))
    const signature = request.headers.get('x-yalidine-signature') 
      || request.headers.get('x_yalidine_signature')
      || request.headers.get('yalidine-signature')
      || payload.signature;
    const webhookSecret = process.env.YALIDINE_WEBHOOK_SECRET || process.env.YALIDINE_WEBHOOK_SECRET_KEY;
    if (webhookSecret) {
      if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (computed !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Validate required fields
    if (!payload.event || !payload.parcel || !payload.parcel.tracking_number) {
      console.error('Missing required webhook fields');
      return NextResponse.json(
        { error: 'Missing required fields: event, parcel, tracking_number' },
        { status: 400 }
      );
    }

    // Official format: { type, events: [...] }
    const maybeType = (payload as any)?.type;
    const maybeEvents = (payload as any)?.events;
    if (maybeType && Array.isArray(maybeEvents)) {
      // Fast ACK first to comply with <10s requirement
      const ack = NextResponse.json({ ok: true, received: maybeEvents.length, type: maybeType });
      defer(async () => {
        for (const evt of maybeEvents as Array<{ event_id: string; occurred_at: string; data: any }>) {
          try {
            const data = evt.data || {};
            const eventId: string | undefined = evt.event_id;
            if (!eventId) continue;

            // Idempotent store
            await prisma.yalidineEvent.upsert({
              where: { id: eventId },
              create: {
                id: eventId,
                type: maybeType,
                occurredAt: evt.occurred_at ? new Date(evt.occurred_at) : new Date(),
                payload: evt as any,
              },
              update: {},
            });

            const tracking: string | undefined = data.tracking;
            if (!tracking) continue;

            const order = await prisma.order.findFirst({
              where: {
                OR: [
                  { trackingNumber: tracking },
                  data.order_id ? { orderNumber: String(data.order_id) } : undefined,
                ].filter(Boolean) as any,
              },
            });
            if (!order) continue;

            const statusText = (data.status ?? '').toString();
            const normalized = statusText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            let newStatus: 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PENDING' | 'PROCESSING' = 'SHIPPED';
            if (maybeType === 'parcel_deleted') newStatus = 'CANCELLED';
            if (maybeType === 'parcel_created') newStatus = 'SHIPPED';
            if (maybeType === 'parcel_status_updated') {
              if (normalized.includes('livr')) newStatus = 'DELIVERED';
              else if (normalized.includes('retour')) newStatus = 'CANCELLED';
              else if (normalized.includes('echou') || normalized.includes('echec') || normalized.includes('failed')) newStatus = 'PROCESSING';
              else newStatus = 'SHIPPED';
            }

            await prisma.order.update({
              where: { id: order.id },
              data: {
                trackingNumber: data.tracking ?? order.trackingNumber,
                status: newStatus,
                deliveredAt: newStatus === 'DELIVERED' ? new Date() : order.deliveredAt,
                shippedAt: newStatus === 'SHIPPED' && !order.shippedAt ? new Date() : order.shippedAt,
              },
            });

            const parcel = await prisma.yalidineParcel.findFirst({ where: { orderId: order.id } });
            if (parcel) {
              await prisma.yalidineParcel.update({
                where: { id: parcel.id },
                data: {
                  tracking: data.tracking ?? parcel.tracking,
                  label_url: data.label ?? parcel.label_url,
                  status: statusText || parcel.status,
                  lastPayload: payload as any,
                },
              });
            }
          } catch (e) {
            console.error('Yalidine event process error:', e);
          }
        }
      });
      return ack;
    }

    // Legacy single event flow via service
    const result = await YalidineService.handleWebhook(payload);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, message: result.message || 'ok' });

  } catch (error) {
    console.error('Yalidine webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests for webhook verification (if needed by Yalidine)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // CRC validation per docs
  const subscribe = searchParams.get('subscribe');
  const crc = searchParams.get('crc_token');
  if (subscribe !== null && crc) return new Response(crc, { status: 200 });
  return NextResponse.json({ ok: true });
}
