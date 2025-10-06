#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function checkFiles() {
  try {
    console.log('🔍 Checking database connection and files...');
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Users: ${userCount}`);
    
    // Check files
    const fileCount = await prisma.tuningFile.count();
    console.log(`📁 Total files in database: ${fileCount}`);
    
    if (fileCount > 0) {
      const files = await prisma.tuningFile.findMany({
        take: 5,
        select: {
          id: true,
          originalFilename: true,
          status: true,
          userId: true,
          estimatedProcessingTime: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📋 Recent files:');
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalFilename}`);
        console.log(`     Status: ${file.status}`);
        console.log(`     User ID: ${file.userId}`);
        console.log(`     Estimated Time: ${file.estimatedProcessingTime || 'None'}`);
        console.log(`     Created: ${file.createdAt.toISOString()}`);
        console.log('');
      });
    } else {
      console.log('❌ No files found in database');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

checkFiles();
