import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";

export const runtime = 'nodejs';

export async function DELETE(
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

    const trackingNumber = order.yalidine.tracking;

    // Clear tracking information (mark as deleted locally)
    await prisma.yalidineParcel.update({
      where: { orderId: order.id },
      data: {
        tracking: null,
        label_url: null,
        status: 'cancelled',
        lastPayload: {
          action: 'deleted',
          timestamp: new Date().toISOString(),
          previous_tracking: trackingNumber,
        },
        updatedAt: new Date(),
      },
    });

    // Also update order status if it was confirmed
    if (order.codStatus === 'SUBMITTED' || order.codStatus === 'DISPATCHED') {
      await prisma.order.update({
        where: { id },
        data: { 
          codStatus: 'CANCELLED',
          trackingNumber: null,
        },
      });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Yalidine parcel deleted successfully',
      deleted_tracking: trackingNumber 
    });
  } catch (error) {
    console.error('Yalidine delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
