import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { notifyCustomerFileReady } from '@/lib/email/service';
import { NotificationService } from '@/lib/services/notifications';
import { sendUpdateToUser } from '@/lib/sse-utils';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'PENDING', 'READY']),
  estimatedProcessingTime: z.number().min(5).max(60).optional() // 5-60 minutes
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
      select: { isAdmin: true, firstName: true, lastName: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: fileId } = await params;
    const body = await request.json();
    const { status, estimatedProcessingTime } = updateStatusSchema.parse(body);

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

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'RECEIVED': ['PENDING'],
      'PENDING': ['READY', 'RECEIVED'],
      'READY': ['PENDING']
    };

    if (!validTransitions[currentFile.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentFile.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update file status
    const updatedFile = await prisma.tuningFile.update({
      where: { id: fileId },
      data: { 
        status,
        updatedDate: new Date(),
        ...(estimatedProcessingTime && { 
          estimatedProcessingTime,
          estimatedProcessingTimeSetAt: new Date()
        })
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        fileId,
        actorId: session.user.id,
        action: 'STATUS_CHANGE',
        oldValue: currentFile.status,
        newValue: status
      }
    });

    // Notify customer about status change (includes Telegram notifications)
    try {
      console.log('📱 Sending customer notification for status change...');
      await NotificationService.notifyCustomerFileStatusUpdate(
        currentFile.userId,
        currentFile.originalFilename,
        currentFile.id,
        status,
        estimatedProcessingTime
      );
      console.log('✅ Customer notification sent successfully');
    } catch (notificationError) {
      console.error('❌ Failed to send customer notification:', notificationError);
      // Continue execution - don't let notification errors break the status update
    }

    // Send real-time update to customer's browser
    sendUpdateToUser(currentFile.userId, {
      type: 'file_status_update',
      fileId: currentFile.id,
      fileName: currentFile.originalFilename,
      oldStatus: currentFile.status,
      newStatus: status,
      message: `File status updated to ${status}`,
      estimatedProcessingTime: estimatedProcessingTime
    });

    // Notify admins about file update
    await NotificationService.notifyAdminFileUpdateByAdmin(
      `${user.firstName} ${user.lastName}`,
      currentFile.originalFilename,
      `Status changed to ${status}`,
      currentFile.id
    );

    // Send Super Admin Bot notification about status change
    try {
      console.log('📱 Sending super admin notification...');
      const { MultiBotTelegramService } = await import('@/lib/services/multi-bot-telegram');
      await MultiBotTelegramService.notifySuperAdmin({
        type: 'system_alert',
        title: 'File Status Updated',
        message: `${user.firstName} ${user.lastName} changed file status to ${status}`,
        details: `File: ${currentFile.originalFilename}\nCustomer: ${currentFile.user.firstName} ${currentFile.user.lastName}${estimatedProcessingTime ? `\nEstimated Time: ${estimatedProcessingTime} minutes` : ''}`,
        actionUrl: `https://compucar.pro/admin/files/${fileId}`
      });
      console.log('✅ Super admin notification sent successfully');
    } catch (superAdminError) {
      console.error('❌ Failed to send super admin notification:', superAdminError);
      // Continue execution - don't let notification errors break the status update
    }

    // Send email notification if status is READY (keep existing email functionality)
    if (status === 'READY') {
      try {
        await notifyCustomerFileReady({
          customerEmail: currentFile.user.email,
          customerName: `${currentFile.user.firstName} ${currentFile.user.lastName}`,
          filename: currentFile.originalFilename,
          price: Number(currentFile.price) > 0 ? Number(currentFile.price) : undefined,
          fileId: currentFile.id
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
        status: updatedFile.status,
        updatedDate: updatedFile.updatedDate?.toISOString().split('T')[0],
        estimatedProcessingTime: updatedFile.estimatedProcessingTime
      }
    });

  } catch (error) {
    console.error('Error updating file status:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
