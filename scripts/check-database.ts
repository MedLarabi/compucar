#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for any existing data...');
    
    // Check if there are any old files or orders
    const allFiles = await prisma.tuningFile.findMany({
      select: {
        id: true,
        originalFilename: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📁 Total files in database: ${allFiles.length}`);
    console.log(`🛒 Total orders in database: ${allOrders.length}`);
    
    if (allFiles.length > 0) {
      console.log('\n📋 All files:');
      allFiles.forEach((file: any, index: number) => {
        console.log(`  ${index + 1}. ${file.originalFilename} (User: ${file.userId})`);
      });
    }
    
    if (allOrders.length > 0) {
      console.log('\n🛒 All orders:');
      allOrders.forEach((order: any, index: number) => {
        console.log(`  ${index + 1}. ${order.orderNumber} (User: ${order.userId})`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();
