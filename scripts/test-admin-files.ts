import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testAdminFiles() {
  try {
    console.log('🔍 Testing Admin Files API Data\n');
    
    // Get all files from database
    const allFiles = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' },
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
    
    console.log(`📊 Total files in database: ${allFiles.length}`);
    
    if (allFiles.length === 0) {
      console.log('❌ No files found in database');
      return;
    }
    
    // Show recent files
    console.log('\n📁 Most recent files:');
    allFiles.slice(0, 5).forEach((file, index) => {
      console.log(`${index + 1}. ${file.originalFilename}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   User: ${file.user.firstName} ${file.user.lastName} (${file.user.email})`);
      console.log(`   Status: ${file.status}`);
      console.log(`   Created: ${file.createdAt.toISOString()}`);
      console.log(`   Upload Date: ${file.uploadDate?.toISOString() || 'N/A'}`);
      console.log('   ' + '─'.repeat(50));
    });
    
    // Test the admin API query
    console.log('\n🧪 Testing admin API query...');
    
    const adminQuery = await prisma.tuningFile.findMany({
      where: {},
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: 0,
      take: 10
    });
    
    console.log(`📊 Admin query returned: ${adminQuery.length} files`);
    
    if (adminQuery.length > 0) {
      console.log('\n📁 Admin query results:');
      adminQuery.forEach((file, index) => {
        console.log(`${index + 1}. ${file.originalFilename}`);
        console.log(`   Status: ${file.status}`);
        console.log(`   User: ${file.user.firstName} ${file.user.lastName}`);
        console.log(`   Created: ${file.createdAt.toISOString()}`);
      });
    }
    
    // Check for any issues
    console.log('\n🔍 Checking for potential issues...');
    
    // Check if there are files with null uploadDate
    const filesWithNullUploadDate = allFiles.filter(f => !f.uploadDate);
    if (filesWithNullUploadDate.length > 0) {
      console.log(`⚠️  ${filesWithNullUploadDate.length} files have null uploadDate`);
    }
    
    // Check status distribution
    const statusCounts = allFiles.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} files`);
    });
    
    // Test pagination
    console.log('\n📄 Testing pagination...');
    const page1 = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 5
    });
    
    const page2 = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5
    });
    
    console.log(`   Page 1: ${page1.length} files`);
    console.log(`   Page 2: ${page2.length} files`);
    
    if (page1.length > 0) {
      console.log(`   Page 1 first file: ${page1[0].originalFilename}`);
    }
    if (page2.length > 0) {
      console.log(`   Page 2 first file: ${page2[0].originalFilename}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminFiles();
