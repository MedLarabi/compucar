import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

/**
 * Test admin file operations
 * GET /api/admin/files/test
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Get all files for admin
    const files = await prisma.tuningFile.findMany({
      take: 5,
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
                label: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Test available admin endpoints
    const availableEndpoints = [
      'GET /api/admin/files - List all files',
      'GET /api/admin/files/[id] - Get file details',
      'POST /api/admin/files/[id]/update-status - Update file status',
      'POST /api/admin/files/[id]/set-price - Set file price',
      'POST /api/admin/files/[id]/set-payment - Update payment status',
      'POST /api/admin/files/[id]/add-note - Add admin notes'
    ];

    return NextResponse.json({
      success: true,
      message: 'Admin access confirmed',
      filesFound: files.length,
      files: files.map(file => ({
        id: file.id,
        filename: file.originalFilename,
        status: file.status,
        uploadDate: file.uploadDate.toISOString().split('T')[0],
        user: `${file.user.firstName} ${file.user.lastName}`,
        modifications: file.fileModifications.length
      })),
      availableEndpoints,
      testInstructions: {
        step1: 'Visit /admin/files to see the file list',
        step2: 'Click on a file to access detailed management',
        step3: 'Try updating status, price, or adding notes',
        step4: 'Check download functionality'
      }
    });

  } catch (error) {
    console.error('Admin test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
