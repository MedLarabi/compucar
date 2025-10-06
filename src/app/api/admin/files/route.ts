import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Admin Files API: Starting request');
    
    // Check authentication and admin access
    const session = await auth();
    console.log('🔍 Admin Files API: Session:', session?.user?.id ? 'Authenticated' : 'Not authenticated');
    
    if (!session?.user?.id) {
      console.log('❌ Admin Files API: No session or user ID');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true, email: true }
    });

    console.log('🔍 Admin Files API: User check:', user);

    if (!user?.isAdmin) {
      console.log('❌ Admin Files API: User is not admin');
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('✅ Admin Files API: User is admin, proceeding...');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    if (status && ['RECEIVED', 'PENDING', 'READY'].includes(status.toUpperCase())) {
      whereClause.status = status.toUpperCase();
    }

    if (paymentStatus && ['PAID', 'NOT_PAID'].includes(paymentStatus.toUpperCase())) {
      whereClause.paymentStatus = paymentStatus.toUpperCase();
    }

    if (customerId && customerId !== 'all') {
      whereClause.userId = customerId;
    }

    if (search) {
      whereClause.OR = [
        { originalFilename: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get files with pagination and summary data
    const [files, total, summaryData] = await Promise.all([
      prisma.tuningFile.findMany({
        where: whereClause,
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

    // Debug logging
    console.log(`Admin API: Found ${files.length} files`);
    console.log(`Admin API: Total files in DB: ${total}`);
    console.log(`Admin API: Most recent file: ${files[0]?.originalFilename}`);

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
      adminNotes: file.adminNotes,
      user: file.user,
      modifications: file.fileModifications.map(fm => ({
        id: fm.modification.id,
        code: fm.modification.code,
        label: fm.modification.label,
        description: fm.modification.description
      })),
      createdAt: file.createdAt.toISOString()
    }));

    // Calculate summary based on filtered data
    const totalPaid = summaryData
      .filter(file => file.paymentStatus === 'PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);
    
    const totalUnpaid = summaryData
      .filter(file => file.paymentStatus === 'NOT_PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);

    console.log(`Summary calculation for filters:`, {
      status: status || 'all',
      paymentStatus: paymentStatus || 'all',
      customerId: customerId || 'all',
      search: search || 'none',
      totalFiles: summaryData.length,
      totalPaid,
      totalUnpaid,
      totalAmount: totalPaid + totalUnpaid
    });

    // Get summary statistics
    const stats = await prisma.tuningFile.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const statusCounts = {
      RECEIVED: 0,
      PENDING: 0,
      READY: 0
    };

    stats.forEach(stat => {
      statusCounts[stat.status as keyof typeof statusCounts] = stat._count.status;
    });

    const response = {
      success: true,
      data: formattedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusCounts,
      summary: {
        totalPaid,
        totalUnpaid,
        totalAmount: totalPaid + totalUnpaid
      }
    };

    console.log('🎯 Admin Files API: Final response:', {
      success: response.success,
      dataLength: response.data.length,
      pagination: response.pagination,
      stats: response.stats,
      summary: response.summary
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching admin files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
