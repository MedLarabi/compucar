#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testCountdownTimer() {
  try {
    console.log('🧪 Testing countdown timer functionality...');

    // Find a PENDING file with estimated processing time
    const pendingFile = await prisma.tuningFile.findFirst({
      where: { 
        status: 'PENDING',
        estimatedProcessingTime: { not: null }
      },
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
      console.log('❌ No PENDING files with estimated processing time found');
      
      // Create a test file
      console.log('🔄 Creating a test file...');
      const testUser = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' }
      });

      if (!testUser) {
        console.log('❌ No customer user found to create test file');
        return;
      }

      const testFile = await prisma.tuningFile.create({
        data: {
          userId: testUser.id,
          originalFilename: 'test-countdown.bin',
          r2Key: 'test-countdown-key',
          fileSize: 1024,
          fileType: 'application/octet-stream',
          status: 'PENDING',
          estimatedProcessingTime: 5, // 5 minutes for quick testing
          estimatedProcessingTimeSetAt: new Date(),
          price: 0,
          paymentStatus: 'PAID'
        }
      });

      console.log(`✅ Created test file: ${testFile.id}`);
      console.log(`📊 Status: ${testFile.status}`);
      console.log(`⏱️ Estimated time: ${testFile.estimatedProcessingTime} minutes`);
      console.log(`🕐 Set at: ${testFile.estimatedProcessingTimeSetAt?.toISOString()}`);

      // Calculate time remaining
      const now = new Date();
      const startTime = testFile.estimatedProcessingTimeSetAt!;
      const elapsed = now.getTime() - startTime.getTime();
      const totalTimeMs = testFile.estimatedProcessingTime! * 60 * 1000;
      const remainingMs = Math.max(0, totalTimeMs - elapsed);
      const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
      const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

      console.log(`⏰ Time remaining: ${remainingMinutes}m ${remainingSeconds}s`);
      console.log(`📈 Progress: ${Math.round(((totalTimeMs - remainingMs) / totalTimeMs) * 100)}%`);

    } else {
      console.log(`📁 Found PENDING file: ${pendingFile.originalFilename}`);
      console.log(`📊 Status: ${pendingFile.status}`);
      console.log(`⏱️ Estimated time: ${pendingFile.estimatedProcessingTime} minutes`);
      console.log(`🕐 Set at: ${pendingFile.estimatedProcessingTimeSetAt?.toISOString()}`);

      if (pendingFile.estimatedProcessingTimeSetAt) {
        // Calculate time remaining
        const now = new Date();
        const startTime = pendingFile.estimatedProcessingTimeSetAt;
        const elapsed = now.getTime() - startTime.getTime();
        const totalTimeMs = pendingFile.estimatedProcessingTime! * 60 * 1000;
        const remainingMs = Math.max(0, totalTimeMs - elapsed);
        const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
        const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

        console.log(`⏰ Time remaining: ${remainingMinutes}m ${remainingSeconds}s`);
        console.log(`📈 Progress: ${Math.round(((totalTimeMs - remainingMs) / totalTimeMs) * 100)}%`);

        if (remainingMs === 0) {
          console.log('⏰ Timer has expired!');
        }
      } else {
        console.log('❌ No timestamp found for estimated processing time');
      }
    }

    // Test updating a file's estimated time
    console.log('\n🔄 Testing estimated time update...');
    const fileToUpdate = await prisma.tuningFile.findFirst({
      where: { status: 'RECEIVED' }
    });

    if (fileToUpdate) {
      const updatedFile = await prisma.tuningFile.update({
        where: { id: fileToUpdate.id },
        data: {
          status: 'PENDING',
          estimatedProcessingTime: 10,
          estimatedProcessingTimeSetAt: new Date()
        }
      });

      console.log(`✅ Updated file ${updatedFile.originalFilename}`);
      console.log(`📊 New status: ${updatedFile.status}`);
      console.log(`⏱️ New estimated time: ${updatedFile.estimatedProcessingTime} minutes`);
      console.log(`🕐 New timestamp: ${updatedFile.estimatedProcessingTimeSetAt?.toISOString()}`);
    }

    console.log('\n🎉 Countdown timer test completed!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing countdown timer:', error);
  }
}

testCountdownTimer();
