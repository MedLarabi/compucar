import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { NotificationService } from '@/lib/services/notifications';
import { z } from 'zod';

const addNoteSchema = z.object({
  adminNotes: z.string().max(2000, 'Notes must be less than 2000 characters')
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
    const { adminNotes } = addNoteSchema.parse(body);

    // Get current file with user info
    const currentFile = await prisma.tuningFile.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    // Update admin notes
    const updatedFile = await prisma.tuningFile.update({
      where: { id: fileId },
      data: { 
        adminNotes,
        updatedDate: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        fileId,
        actorId: session.user.id,
        action: 'ADMIN_NOTES_UPDATED',
        oldValue: currentFile.adminNotes || '',
        newValue: adminNotes
      }
    });

    // Notify customer about admin comment
    if (adminNotes && adminNotes.trim()) {
      await NotificationService.notifyCustomerFileAdminComment(
        currentFile.userId,
        currentFile.originalFilename,
        adminNotes,
        currentFile.id
      );
    }

    // Notify admins about file update
    await NotificationService.notifyAdminFileUpdateByAdmin(
      `${user.firstName} ${user.lastName}`,
      currentFile.originalFilename,
      'Admin notes updated',
      currentFile.id
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updatedFile.id,
        adminNotes: updatedFile.adminNotes,
        updatedDate: updatedFile.updatedDate?.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error updating admin notes:', error);

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
