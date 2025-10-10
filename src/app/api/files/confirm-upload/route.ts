import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { headObject } from '@/lib/storage/r2';
import { notifyAdminsNewFile } from '@/lib/email/service';
import { NotificationService } from '@/lib/services/notifications';
import { z } from 'zod';

const confirmUploadSchema = z.object({
  fileId: z.string().uuid('Invalid file ID'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { fileId } = confirmUploadSchema.parse(body);

    // Get file record
    const tuningFile = await prisma.tuningFile.findFirst({
      where: {
        id: fileId,
        userId: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        fileModifications: {
          include: {
            modification: true
          }
        }
      }
    });

    if (!tuningFile) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Verify file exists in R2 (optional - can be done on first download instead)
    try {
      const exists = await headObject(tuningFile.r2Key);
      if (!exists) {
        return NextResponse.json(
          { error: 'File upload was not completed successfully' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.warn('Could not verify file existence in R2:', error);
      // Continue anyway - we'll verify on first download
    }

    // Notify customer that their file was received (includes Telegram notifications)
    await NotificationService.notifyCustomerFileStatusUpdate(
      tuningFile.userId,
      tuningFile.originalFilename,
      tuningFile.id,
      'RECEIVED'
    );

    // Notify admins about new file upload with URGENT priority (call notification)
    console.log('🔔 Triggering admin notification for file upload:', {
      customerName: `${tuningFile.user.firstName} ${tuningFile.user.lastName}`,
      filename: tuningFile.originalFilename,
      fileId: tuningFile.id,
      userId: tuningFile.userId,
      fileSize: Number(tuningFile.fileSize),
      modifications: tuningFile.fileModifications.map(fm => fm.modification.label)
    });
    
    await NotificationService.notifyAdminNewFileUploadWithDetails(
      `${tuningFile.user.firstName} ${tuningFile.user.lastName}`,
      tuningFile.originalFilename,
      tuningFile.id,
      tuningFile.userId,
      Number(tuningFile.fileSize),
      tuningFile.fileModifications.map(fm => fm.modification.label)
    );
    
    console.log('✅ Admin notification triggered successfully');

    // Send email notifications to admins (keep existing email functionality)
    try {
      await notifyAdminsNewFile({
        customerName: `${tuningFile.user.firstName} ${tuningFile.user.lastName}`,
        filename: tuningFile.originalFilename,
        modifications: tuningFile.fileModifications.map(fm => fm.modification.label),
        fileId: tuningFile.id
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: tuningFile.id,
        status: tuningFile.status,
        uploadDate: tuningFile.uploadDate.toISOString().split('T')[0] // Date only
      }
    });

  } catch (error) {
    console.error('Error in confirm-upload:', error);

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
