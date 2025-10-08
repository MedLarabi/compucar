import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { generateDownloadUrl } from '@/lib/storage/r2';

export async function GET(
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

    // Get file record
    const tuningFile = await prisma.tuningFile.findUnique({
      where: { id: fileId },
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
            modification: {
              select: {
                id: true,
                code: true,
                label: true,
                description: true
              }
            }
          }
        },
        auditLogs: {
          include: {
            actor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    // Generate download URL for original file
    let downloadUrl = null;
    try {
      downloadUrl = await generateDownloadUrl({
        r2Key: tuningFile.r2Key,
        filename: tuningFile.originalFilename
      });
    } catch (error) {
      console.error('Error generating download URL:', error);
      // Continue without download URL
    }

    // Generate download URL for modified file if it exists
    let modifiedDownloadUrl = null;
    if (tuningFile.modifiedR2Key && tuningFile.modifiedFilename) {
      try {
        modifiedDownloadUrl = await generateDownloadUrl({
          r2Key: tuningFile.modifiedR2Key,
          filename: tuningFile.modifiedFilename
        });
      } catch (error) {
        console.error('Error generating modified file download URL:', error);
        // Continue without modified download URL
      }
    }

    // Format response
    const response = {
      id: tuningFile.id,
      originalFilename: tuningFile.originalFilename,
      fileSize: Number(tuningFile.fileSize),
      fileType: tuningFile.fileType,
      status: tuningFile.status,
      price: Number(tuningFile.price),
      paymentStatus: tuningFile.paymentStatus,
      uploadDate: tuningFile.uploadDate.toISOString().split('T')[0], // Date only
      updatedDate: tuningFile.updatedDate?.toISOString().split('T')[0] || null,
      customerComment: tuningFile.customerComment,
      dtcCodes: tuningFile.dtcCodes, // Add DTC codes field
      adminNotes: tuningFile.adminNotes,
      estimatedProcessingTime: tuningFile.estimatedProcessingTime,
      estimatedProcessingTimeSetAt: tuningFile.estimatedProcessingTimeSetAt?.toISOString() || null,
      user: tuningFile.user,
      modifications: tuningFile.fileModifications.map(fm => ({
        id: fm.modification.id,
        code: fm.modification.code,
        label: fm.modification.label,
        description: fm.modification.description
      })),
      auditLogs: tuningFile.auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        oldValue: log.oldValue,
        newValue: log.newValue,
        date: log.date.toISOString().split('T')[0], // Date only
        actor: log.actor,
        createdAt: log.createdAt.toISOString()
      })),
      downloadUrl,
      downloadUrlExpiresIn: downloadUrl ? Number(process.env.PRESIGNED_URL_EXPIRES || 900) : null,
      // Modified file fields
      modifiedFilename: tuningFile.modifiedFilename,
      modifiedFileSize: tuningFile.modifiedFileSize ? Number(tuningFile.modifiedFileSize) : null,
      modifiedFileType: tuningFile.modifiedFileType,
      modifiedUploadDate: tuningFile.modifiedUploadDate?.toISOString().split('T')[0] || null,
      modifiedDownloadUrl,
      modifiedDownloadUrlExpiresIn: modifiedDownloadUrl ? Number(process.env.PRESIGNED_URL_EXPIRES || 900) : null,
      createdAt: tuningFile.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching admin file details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
