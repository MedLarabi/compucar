import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { generateDownloadUrl } from '@/lib/storage/r2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;

    // Get the tuning file
    const tuningFile = await prisma.tuningFile.findUnique({
      where: { id: fileId },
      select: { 
        id: true, 
        userId: true, 
        modifiedFilename: true,
        modifiedR2Key: true,
        status: true
      }
    });

    if (!tuningFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user owns this file or is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (tuningFile.userId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if modified file exists
    if (!tuningFile.modifiedR2Key || !tuningFile.modifiedFilename) {
      return NextResponse.json(
        { error: 'Modified file not available' },
        { status: 404 }
      );
    }

    // Check if file is ready for download
    if (tuningFile.status !== 'READY') {
      return NextResponse.json(
        { error: 'File is not ready for download' },
        { status: 400 }
      );
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl({
      r2Key: tuningFile.modifiedR2Key,
      filename: tuningFile.modifiedFilename
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename: tuningFile.modifiedFilename,
      expiresIn: 900 // 15 minutes
    });

  } catch (error) {
    console.error('Error generating modified file download URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
