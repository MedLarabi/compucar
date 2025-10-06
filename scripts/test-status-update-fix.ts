#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function testStatusUpdateFix() {
  try {
    console.log('🧪 Testing status update fix after Prisma regeneration...');

    // Find a RECEIVED file to test with
    const receivedFile = await prisma.tuningFile.findFirst({
      where: { status: 'RECEIVED' }
    });

    if (!receivedFile) {
      console.log('❌ No RECEIVED files found to test with');
      return;
    }

    console.log(`📁 Found RECEIVED file: ${receivedFile.originalFilename}`);
    console.log(`📊 Current status: ${receivedFile.status}`);
    console.log(`⏱️ Current estimated time: ${receivedFile.estimatedProcessingTime || 'None'}`);

    // Test updating status to PENDING with estimated time
    console.log('\n🔄 Testing status update to PENDING with estimated time...');
    
    const updatedFile = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        status: 'PENDING',
        estimatedProcessingTime: 15,
        estimatedProcessingTimeSetAt: new Date(),
        updatedDate: new Date()
      }
    });

    console.log(`✅ Status update successful!`);
    console.log(`📊 New status: ${updatedFile.status}`);
    console.log(`⏱️ New estimated time: ${updatedFile.estimatedProcessingTime} minutes`);
    console.log(`🕐 Timestamp set: ${updatedFile.estimatedProcessingTimeSetAt?.toISOString()}`);

    // Test updating only the estimated time (status stays PENDING)
    console.log('\n🔄 Testing estimated time update only...');
    
    const updatedFile2 = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        estimatedProcessingTime: 30,
        estimatedProcessingTimeSetAt: new Date(),
        updatedDate: new Date()
      }
    });

    console.log(`✅ Estimated time update successful!`);
    console.log(`📊 Status remains: ${updatedFile2.status}`);
    console.log(`⏱️ New estimated time: ${updatedFile2.estimatedProcessingTime} minutes`);
    console.log(`🕐 New timestamp: ${updatedFile2.estimatedProcessingTimeSetAt?.toISOString()}`);

    // Reset back to RECEIVED for future testing
    console.log('\n🔄 Resetting to RECEIVED...');
    
    const resetFile = await prisma.tuningFile.update({
      where: { id: receivedFile.id },
      data: { 
        status: 'RECEIVED',
        estimatedProcessingTime: null,
        estimatedProcessingTimeSetAt: null,
        updatedDate: new Date()
      }
    });

    console.log(`✅ Reset to RECEIVED`);
    console.log(`📊 Final status: ${resetFile.status}`);
    console.log(`⏱️ Final estimated time: ${resetFile.estimatedProcessingTime || 'None'}`);

    console.log('\n🎉 All status update tests completed successfully!');
    console.log('✅ The Prisma client regeneration fixed the issue!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error testing status update:', error);
  }
}

testStatusUpdateFix();
