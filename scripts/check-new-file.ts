import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkNewFile() {
  try {
    console.log('🔍 Checking for the new file in database\n');
    
    // Get the most recent files
    const recentFiles = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${recentFiles.length} most recent files:\n`);
    
    recentFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.originalFilename}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   R2 Key: ${file.r2Key}`);
      console.log(`   Size: ${file.fileSize} bytes`);
      console.log(`   Created: ${file.createdAt.toISOString()}`);
      console.log(`   User: ${file.userId}`);
      console.log('   ' + '─'.repeat(50));
    });
    
    // Check if the new file from R2 is in the database
    const newR2Key = 'tuning-files/cme7o1ods0000vinsbj0gpn7q/8aec0818-30a6-474c-90af-2ff889c02e7d_1759510104272_WinOLS_PEUGEOT_1.6HDI_FAP_EGR_ADDT.bin';
    
    console.log(`\n🔍 Looking for R2 key: ${newR2Key}`);
    
    const fileInDB = await prisma.tuningFile.findFirst({
      where: {
        r2Key: newR2Key
      }
    });
    
    if (fileInDB) {
      console.log('✅ File found in database!');
      console.log(`   Original filename: ${fileInDB.originalFilename}`);
      console.log(`   Created: ${fileInDB.createdAt.toISOString()}`);
    } else {
      console.log('❌ File NOT found in database');
      console.log('   This means the file was uploaded to R2 but not saved to database');
    }
    
    // Check for any files with similar names
    console.log('\n🔍 Looking for files with similar names...');
    const similarFiles = await prisma.tuningFile.findMany({
      where: {
        originalFilename: {
          contains: 'WinOLS_PEUGEOT_1.6HDI_FAP_EGR_ADDT'
        }
      }
    });
    
    console.log(`Found ${similarFiles.length} similar files:`);
    similarFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.originalFilename} (${file.r2Key})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewFile();
