import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      userId: session.user.id
    };

    if (status && ['RECEIVED', 'PENDING', 'READY'].includes(status.toUpperCase())) {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause.originalFilename = { contains: search, mode: 'insensitive' };
    }

    // Get files with pagination and summary data
    const [files, total, summaryData] = await Promise.all([
      prisma.tuningFile.findMany({
        where: whereClause,
        include: {
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
        },
        skip,
        take: limit
      }),
      prisma.tuningFile.count({
        where: whereClause
      }),
      // Get summary data for all files matching the filters
      prisma.tuningFile.findMany({
        where: whereClause,
        select: {
          price: true,
          paymentStatus: true
        }
      })
    ]);

    // Calculate summary based on filtered data
    const totalPaid = summaryData
      .filter(file => file.paymentStatus === 'PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);
    
    const totalUnpaid = summaryData
      .filter(file => file.paymentStatus === 'NOT_PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);

    // Debug logging
    console.log(`API: Found ${files.length} files for user ${session.user.id}`);
    console.log(`API: Most recent file: ${files[0]?.originalFilename}`);
    console.log(`API: Total files in DB: ${total}`);
    console.log(`Customer Summary calculation:`, {
      status: status || 'all',
      search: search || 'none',
      totalFiles: summaryData.length,
      totalPaid,
      totalUnpaid,
      totalAmount: totalPaid + totalUnpaid
    });

    // Format response data
    const formattedFiles = files.map(file => ({
      id: file.id,
      originalFilename: file.originalFilename,
      fileSize: Number(file.fileSize),
      fileType: file.fileType,
      status: file.status,
      price: Number(file.price),
      paymentStatus: file.paymentStatus,
      uploadDate: file.uploadDate.toISOString().split('T')[0], // Date only
      updatedDate: file.updatedDate?.toISOString().split('T')[0] || null,
      customerComment: file.customerComment,
      modifications: file.fileModifications.map(fm => ({
        id: fm.modification.id,
        code: fm.modification.code,
        label: fm.modification.label
      })),
      createdAt: file.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: formattedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalPaid,
        totalUnpaid,
        totalAmount: totalPaid + totalUnpaid
      }
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
