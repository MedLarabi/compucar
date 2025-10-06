import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/database/prisma";
import { z } from "zod";

export const runtime = 'nodejs';

const updateAddressSchema = z.object({
  wilaya: z.string().min(1, "Wilaya is required"),
  commune: z.string().min(1, "Commune is required"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { wilaya, commune } = updateAddressSchema.parse(body);

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { yalidine: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!order.yalidine) return NextResponse.json({ error: 'No Yalidine data found' }, { status: 400 });

    // Validate wilaya/commune against database
    const dbWilaya = await prisma.wilaya.findFirst({
      where: { nameFr: { equals: wilaya, mode: 'insensitive' }, active: true },
      select: { id: true, nameFr: true },
    });

    if (!dbWilaya) {
      return NextResponse.json({ 
        error: `Wilaya "${wilaya}" not found in database`,
        availableWilayas: await prisma.wilaya.findMany({
          where: { active: true },
          select: { nameFr: true },
          orderBy: { nameFr: 'asc' },
          take: 10
        })
      }, { status: 400 });
    }

    const dbCommune = await prisma.commune.findFirst({
      where: {
        wilayaId: dbWilaya.id,
        nameFr: { equals: commune, mode: 'insensitive' },
        active: true,
      },
      select: { id: true, nameFr: true },
    });

    if (!dbCommune) {
      return NextResponse.json({ 
        error: `Commune "${commune}" not found for wilaya "${dbWilaya.nameFr}"`,
        availableCommunes: await prisma.commune.findMany({
          where: { wilayaId: dbWilaya.id, active: true },
          select: { nameFr: true },
          orderBy: { nameFr: 'asc' },
          take: 10
        })
      }, { status: 400 });
    }

    // Update the yalidine data with exact names
    await prisma.yalidineParcel.update({
      where: { orderId: order.id },
      data: {
        to_wilaya_name: dbWilaya.nameFr,
        to_commune_name: dbCommune.nameFr,
        address: `${dbCommune.nameFr}, ${dbWilaya.nameFr}`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      ok: true,
      message: 'Address updated successfully',
      wilaya: dbWilaya.nameFr,
      commune: dbCommune.nameFr
    });

  } catch (error) {
    console.error('Address update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
