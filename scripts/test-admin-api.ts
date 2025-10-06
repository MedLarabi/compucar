#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testAdminAPI() {
  try {
    console.log('🧪 Testing admin API logic...');

    // Simulate the admin API logic
    const session = { user: { id: 'cmgcq35mc0000visscs88u5g3' } }; // Admin user ID

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, role: true, email: true }
    });

    console.log('👤 User check:', user);

    if (!user?.isAdmin) {
      console.log('❌ User is not admin');
      return;
    }

    console.log('✅ User is admin, proceeding with file fetch...');

    // Get files
    const [files, total, summaryData] = await Promise.all([
      prisma.tuningFile.findMany({
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
        take: 10
      }),
      prisma.tuningFile.count(),
      prisma.tuningFile.findMany({
        select: {
          price: true,
          paymentStatus: true
        }
      })
    ]);

    console.log(`📁 Found ${files.length} files`);
    console.log(`📊 Total files: ${total}`);
    console.log(`💰 Summary data: ${summaryData.length} records`);

    // Format response data
    const formattedFiles = files.map(file => ({
      id: file.id,
      originalFilename: file.originalFilename,
      fileSize: Number(file.fileSize),
      fileType: file.fileType,
      status: file.status,
      price: Number(file.price),
      paymentStatus: file.paymentStatus,
      uploadDate: file.uploadDate.toISOString().split('T')[0],
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

    console.log('✅ Formatted files:', formattedFiles.length);
    console.log('📋 First file:', formattedFiles[0]?.originalFilename);

    // Calculate summary
    const totalPaid = summaryData
      .filter(file => file.paymentStatus === 'PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);
    
    const totalUnpaid = summaryData
      .filter(file => file.paymentStatus === 'NOT_PAID')
      .reduce((sum, file) => sum + Number(file.price), 0);

    // Get stats
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
        page: 1,
        limit: 10,
        total,
        pages: Math.ceil(total / 10)
      },
      stats: statusCounts,
      summary: {
        totalPaid,
        totalUnpaid,
        totalAmount: totalPaid + totalUnpaid
      }
    };

    console.log('🎯 Final response structure:');
    console.log('- success:', response.success);
    console.log('- data length:', response.data.length);
    console.log('- pagination:', response.pagination);
    console.log('- stats:', response.stats);
    console.log('- summary:', response.summary);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing admin API:', error);
  }
}

testAdminAPI();