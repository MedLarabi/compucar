#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testStatusUpdate() {
  try {
    console.log('🧪 Testing status update functionality...');

    // Get a file that's not PENDING
    const receivedFile = await prisma.tuningFile.findFirst({
      where: { status: 'RECEIVED' },
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

    if (!receivedFile) {
      console.log('❌ No RECEIVED files found');
      return;
    }

    console.log(`📁 Found RECEIVED file: ${receivedFile.originalFilename}`);
    console.log(`📊 Current status: ${receivedFile.status}`);
    console.log(`⏱️ Current estimated time: ${receivedFile.estimatedProcessingTime || 'None'}`);

    // Test 1: Update status to PENDING with estimated time
    console.log('\n🔄 Test 1: Updating status to PENDING with estimated time...');
    
    const updatedFile1 = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        status: 'PENDING',
        estimatedProcessingTime: 15,
        updatedDate: new Date()
      }
    });

    console.log(`✅ Updated to PENDING with 15 minutes estimated time`);
    console.log(`📊 New status: ${updatedFile1.status}`);
    console.log(`⏱️ New estimated time: ${updatedFile1.estimatedProcessingTime} minutes`);

    // Test 2: Update only estimated time (status stays PENDING)
    console.log('\n🔄 Test 2: Updating only estimated time...');
    
    const updatedFile2 = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        estimatedProcessingTime: 30,
        updatedDate: new Date()
      }
    });

    console.log(`✅ Updated estimated time to 30 minutes`);
    console.log(`📊 Status remains: ${updatedFile2.status}`);
    console.log(`⏱️ New estimated time: ${updatedFile2.estimatedProcessingTime} minutes`);

    // Test 3: Update status to READY (estimated time should be cleared)
    console.log('\n🔄 Test 3: Updating status to READY...');
    
    const updatedFile3 = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        status: 'READY',
        estimatedProcessingTime: null,
        updatedDate: new Date()
      }
    });

    console.log(`✅ Updated to READY`);
    console.log(`📊 New status: ${updatedFile3.status}`);
    console.log(`⏱️ Estimated time cleared: ${updatedFile3.estimatedProcessingTime || 'None'}`);

    // Test 4: Reset back to RECEIVED for future testing
    console.log('\n🔄 Test 4: Resetting to RECEIVED...');
    
    const resetFile = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        status: 'RECEIVED',
        estimatedProcessingTime: null,
        updatedDate: new Date()
      }
    });

    console.log(`✅ Reset to RECEIVED`);
    console.log(`📊 Final status: ${resetFile.status}`);
    console.log(`⏱️ Final estimated time: ${resetFile.estimatedProcessingTime || 'None'}`);

    console.log('\n🎉 All status update tests completed successfully!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing status update:', error);
  }
}

testStatusUpdate();
