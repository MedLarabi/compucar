#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testEstimatedTimeAdmin() {
  try {
    console.log('🧪 Testing estimated processing time in admin panel...');

    // Get a file with PENDING status
    const pendingFile = await prisma.tuningFile.findFirst({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!pendingFile) {
      console.log('❌ No PENDING files found');
      return;
    }

    console.log(`📁 Found PENDING file: ${pendingFile.originalFilename}`);
    console.log(`⏱️ Current estimated time: ${pendingFile.estimatedProcessingTime || 'None'}`);

    // Update the estimated processing time
    const updatedFile = await prisma.tuningFile.update({
      where: { id: pendingFile.id },
      data: { estimatedProcessingTime: 30 }
    });

    console.log(`✅ Updated estimated time to: ${updatedFile.estimatedProcessingTime} minutes`);

    // Test the admin API response
    console.log('\n🔍 Testing admin API response...');
    
    const adminFile = await prisma.tuningFile.findUnique({
      where: { id: pendingFile.id },
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
      }
    });

    if (adminFile) {
      console.log('✅ Admin API would return:');
      console.log(`   - ID: ${adminFile.id}`);
      console.log(`   - Filename: ${adminFile.originalFilename}`);
      console.log(`   - Status: ${adminFile.status}`);
      console.log(`   - Estimated Time: ${adminFile.estimatedProcessingTime} minutes`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing estimated time:', error);
  }
}

testEstimatedTimeAdmin();
