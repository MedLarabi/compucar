#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function updateExistingFileTimestamp() {
  try {
    console.log('🔄 Updating existing PENDING file with timestamp...');

    const file = await prisma.tuningFile.findFirst({
      where: { 
        status: 'PENDING',
        estimatedProcessingTime: { not: null },
        estimatedProcessingTimeSetAt: null
      }
    });

    if (file) {
      console.log(`📁 Found file: ${file.originalFilename}`);
      console.log(`⏱️ Estimated time: ${file.estimatedProcessingTime} minutes`);
      
      const updated = await prisma.tuningFile.update({
        where: { id: file.id },
        data: { 
          estimatedProcessingTimeSetAt: new Date()
        }
      });

      console.log(`✅ Updated file with timestamp: ${updated.estimatedProcessingTimeSetAt?.toISOString()}`);
    } else {
      console.log('❌ No PENDING file without timestamp found');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error updating file timestamp:', error);
  }
}

updateExistingFileTimestamp();
