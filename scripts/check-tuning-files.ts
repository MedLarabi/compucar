import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTuningFiles() {
  try {
    console.log('🔍 Checking tuning files in database...\n');
    
    const count = await prisma.tuningFile.count();
    console.log(`📊 Total tuning files: ${count}`);
    
    if (count > 0) {
      const files = await prisma.tuningFile.findMany({
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isAdmin: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('\n📁 Sample files:');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.originalFilename}`);
        console.log(`   User: ${file.user.email} (${file.user.role}, isAdmin: ${file.user.isAdmin})`);
        console.log(`   Status: ${file.status}`);
        console.log(`   Created: ${file.createdAt.toISOString()}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No tuning files found in database');
      console.log('💡 You may need to upload some files first');
    }
    
  } catch (error) {
    console.error('❌ Error checking tuning files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTuningFiles();
