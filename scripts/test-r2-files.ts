import { PrismaClient } from '@prisma/client';
import { generateDownloadUrl } from '@/lib/storage/r2';

const prisma = new PrismaClient();

async function testR2Files() {
  try {
    console.log('🔍 Testing R2 Cloudflare file fetching...\n');
    
    // Check R2 environment variables
    const r2Config = {
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      accountId: process.env.R2_ACCOUNT_ID
    };
    
    console.log('📋 R2 Configuration Status:');
    Object.entries(r2Config).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${key.includes('KEY') ? '***' + value.slice(-4) : value}`);
      } else {
        console.log(`   ❌ ${key}: Not set`);
      }
    });
    
    if (!r2Config.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucket) {
      console.log('\n❌ R2 not configured! Files cannot be fetched from Cloudflare.');
      console.log('   Please set up R2 environment variables in .env.local');
      return;
    }
    
    console.log('\n📁 Fetching files from database...');
    
    // Get files from database
    const files = await prisma.tuningFile.findMany({
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`   Found ${files.length} files in database\n`);
    
    if (files.length === 0) {
      console.log('❌ No files found in database');
      return;
    }
    
    // Test R2 download URL generation for each file
    console.log('🔗 Testing R2 download URL generation...\n');
    
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const file = files[i];
      console.log(`${i + 1}. Testing file: ${file.originalFilename}`);
      console.log(`   R2 Key: ${file.r2Key}`);
      console.log(`   File Size: ${Number(file.fileSize)} bytes`);
      console.log(`   Status: ${file.status}`);
      
      try {
        // Test generating download URL
        const downloadUrl = await generateDownloadUrl({
          r2Key: file.r2Key,
          filename: file.originalFilename
        });
        
        console.log(`   ✅ Download URL generated successfully`);
        console.log(`   URL: ${downloadUrl.substring(0, 100)}...`);
        
        // Test if URL is accessible
        try {
          const response = await fetch(downloadUrl, { method: 'HEAD' });
          if (response.ok) {
            console.log(`   ✅ File is accessible in R2 (Status: ${response.status})`);
          } else {
            console.log(`   ❌ File not accessible in R2 (Status: ${response.status})`);
          }
        } catch (fetchError) {
          console.log(`   ⚠️  Could not test file accessibility: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }
        
      } catch (r2Error) {
        console.log(`   ❌ Failed to generate download URL: ${r2Error instanceof Error ? r2Error.message : String(r2Error)}`);
      }
      
      console.log('   ---');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Database files: ${files.length}`);
    console.log(`   R2 configured: ${r2Config.endpoint ? 'Yes' : 'No'}`);
    console.log(`   Files uploaded to R2: ${files.filter(f => f.r2Key).length}`);
    
  } catch (error) {
    console.error('❌ Error testing R2 files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testR2Files();
