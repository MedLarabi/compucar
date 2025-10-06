import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

/**
 * Test endpoint to simulate the file upload request
 * POST /api/files/test-upload
 */
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

    const body = await request.json();
    console.log('Test upload request received:', {
      originalFilename: body.originalFilename,
      fileSize: body.fileSize,
      fileType: body.fileType,
      modificationIds: body.modificationIds,
      customerComment: body.customerComment
    });

    // Simulate a successful response without actually creating database records
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working correctly',
      data: {
        fileId: 'test-file-id',
        uploadUrl: 'https://test-upload-url.com/test',
        expiresIn: 900
      },
      receivedData: {
        originalFilename: body.originalFilename,
        fileSize: body.fileSize,
        fileType: body.fileType,
        modificationIds: body.modificationIds,
        customerComment: body.customerComment,
        userId: session.user.id
      }
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test endpoint error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
