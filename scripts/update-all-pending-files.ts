#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function updateAllPendingFiles() {
  try {
    console.log('🔄 Updating all PENDING files with timestamps...');

    const files = await prisma.tuningFile.findMany({
      where: { 
        status: 'PENDING',
        estimatedProcessingTime: { not: null },
        estimatedProcessingTimeSetAt: null
      }
    });

    console.log(`📁 Found ${files.length} PENDING files without timestamps`);

    for (const file of files) {
      console.log(`\n📄 Processing: ${file.originalFilename}`);
      console.log(`⏱️ Estimated time: ${file.estimatedProcessingTime} minutes`);
      
      const updated = await prisma.tuningFile.update({
        where: { id: file.id },
        data: { 
          estimatedProcessingTimeSetAt: new Date()
        }
      });

      console.log(`✅ Updated with timestamp: ${updated.estimatedProcessingTimeSetAt?.toISOString()}`);
    }

    console.log(`\n🎉 Updated ${files.length} files successfully!`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error updating files:', error);
  }
}

updateAllPendingFiles();
