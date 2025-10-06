import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { generateModifiedR2Key, validateFileType, validateFileSize } from '@/lib/storage/r2';
import { generateUploadUrl } from '@/lib/storage/r2';
import { NotificationService } from '@/lib/services/notifications';

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

    // Get the tuning file with user information and modifications
    const tuningFile = await prisma.tuningFile.findUnique({
      where: { id: fileId },
      select: { 
        id: true, 
        userId: true, 
        originalFilename: true,
        uploadDate: true,
        user: {
          select: { firstName: true, lastName: true }
        },
        fileModifications: {
          include: {
            modification: {
              select: { label: true }
            }
          }
        }
      }
    });

    if (!tuningFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (!validateFileType(file.name, file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File too large' },
        { status: 400 }
      );
    }

    // Generate R2 key for modified file using client info
    const clientName = tuningFile.user ? `${tuningFile.user.firstName} ${tuningFile.user.lastName}` : 'unknown-client';
    const uploadDate = tuningFile.uploadDate || new Date();
    
    // Get modification names for folder naming
    const modificationNames = tuningFile.fileModifications.map(fm => fm.modification.label);
    
    const modifiedR2Key = generateModifiedR2Key(
      tuningFile.userId,
      fileId,
      file.name,
      clientName,
      uploadDate,
      modificationNames
    );

    // Generate upload URL
    const uploadUrl = await generateUploadUrl({
      r2Key: modifiedR2Key,
      contentType: file.type,
      contentLength: file.size
    });

    // Upload file to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file to R2: ${uploadResponse.status} ${errorText}`);
    }

    // Update database with modified file info and change status to READY
    const updatedFile = await prisma.tuningFile.update({
      where: { id: fileId },
      data: {
        modifiedFilename: file.name,
        modifiedR2Key: modifiedR2Key,
        modifiedFileSize: BigInt(file.size),
        modifiedFileType: file.type,
        modifiedUploadDate: new Date(),
        updatedDate: new Date(),
        status: 'READY', // Automatically change status to READY
        estimatedProcessingTime: null, // Clear estimated time since file is ready
        estimatedProcessingTimeSetAt: null, // Clear timestamp
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        fileId: fileId,
        action: 'MODIFIED_FILE_UPLOADED',
        newValue: file.name,
        actorId: session.user.id,
      }
    });

    // Send notification to customer that their file is ready
    await NotificationService.notifyCustomerFileReady(
      tuningFile.userId,
      fileId,
      file.name
    );

    return NextResponse.json({
      success: true,
      message: 'Modified file uploaded successfully and status changed to READY',
      data: {
        modifiedFilename: updatedFile.modifiedFilename,
        modifiedFileSize: Number(updatedFile.modifiedFileSize),
        modifiedFileType: updatedFile.modifiedFileType,
        modifiedUploadDate: updatedFile.modifiedUploadDate,
        status: updatedFile.status,
      }
    });

  } catch (error) {
    console.error('Error uploading modified file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
