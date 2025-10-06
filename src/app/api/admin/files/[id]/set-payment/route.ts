import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { notifyCustomerPaymentConfirmed } from '@/lib/email/service';
import { z } from 'zod';

const setPaymentSchema = z.object({
  paymentStatus: z.enum(['NOT_PAID', 'PAID'])
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
    const { paymentStatus } = setPaymentSchema.parse(body);

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

    // Update payment status
    const updatedFile = await prisma.tuningFile.update({
      where: { id: fileId },
      data: { 
        paymentStatus,
        updatedDate: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        fileId,
        actorId: session.user.id,
        action: 'PAYMENT_STATUS_CHANGE',
        oldValue: currentFile.paymentStatus,
        newValue: paymentStatus
      }
    });

    // Notify customer about payment status change
    if (paymentStatus === 'PAID') {
      await prisma.tuningNotification.create({
        data: {
          userId: currentFile.userId,
          type: 'PAYMENT_CONFIRMED',
          title: 'Payment Confirmed',
          message: `Payment has been confirmed for your file "${currentFile.originalFilename}"`,
          fileId: currentFile.id
        }
      });

      // Send email notification
      try {
        await notifyCustomerPaymentConfirmed({
          customerEmail: currentFile.user.email,
          customerName: `${currentFile.user.firstName} ${currentFile.user.lastName}`,
          filename: currentFile.originalFilename,
          price: Number(currentFile.price)
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        paymentStatus: updatedFile.paymentStatus,
        updatedDate: updatedFile.updatedDate?.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);

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
