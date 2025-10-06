import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { notifyCustomerPriceSet } from '@/lib/email/service';
import { z } from 'zod';

const setPriceSchema = z.object({
  price: z.number().min(0, 'Price must be non-negative')
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: fileId } = await params;
    const body = await request.json();
    const { price } = setPriceSchema.parse(body);

    // Get current file
    const currentFile = await prisma.tuningFile.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!currentFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Update file price
    const updatedFile = await prisma.tuningFile.update({
      where: { id: fileId },
      data: { 
        price,
        updatedDate: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        fileId,
        actorId: session.user.id,
        action: 'PRICE_SET',
        oldValue: currentFile.price.toString(),
        newValue: price.toString()
      }
    });

    // Notify customer about price
    await prisma.tuningNotification.create({
      data: {
        userId: currentFile.userId,
        type: 'PRICE_SET',
        title: 'Price Set',
        message: `Price has been set for your file "${currentFile.originalFilename}": ${price.toFixed(0)} DA`,
        fileId: currentFile.id
      }
    });

    // Send email notification
    try {
      await notifyCustomerPriceSet({
        customerEmail: currentFile.user.email,
        customerName: `${currentFile.user.firstName} ${currentFile.user.lastName}`,
        filename: currentFile.originalFilename,
        price
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        price: Number(updatedFile.price),
        updatedDate: updatedFile.updatedDate?.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error setting file price:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
