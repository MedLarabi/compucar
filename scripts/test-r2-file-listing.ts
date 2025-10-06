import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testR2FileListing() {
  try {
    console.log('🔍 Testing R2 File Listing with Public URL\n');
    
    // R2 Client for listing
    const r2Client = new S3Client({
      region: process.env.R2_REGION || "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: false,
    });
    
    const bucketName = process.env.R2_BUCKET!;
    const publicUrl = process.env.R2_PUBLIC_URL;
    
    console.log(`Bucket: ${bucketName}`);
    console.log(`Public URL: ${publicUrl}`);
    console.log(`R2 Endpoint: ${process.env.R2_ENDPOINT}\n`);
    
    // 1. List all objects from R2
    console.log('1️⃣ Listing all objects from R2...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000
    });
    
    const r2Response = await r2Client.send(listCommand);
    const r2Objects = r2Response.Contents || [];
    
    console.log(`   Found ${r2Objects.length} objects in R2 bucket\n`);
    
    if (r2Objects.length === 0) {
      console.log('❌ No objects found in R2 bucket');
      return;
    }
    
    // 2. Display all R2 objects
    console.log('📁 R2 Objects:');
    r2Objects.forEach((obj, index) => {
      const key = obj.Key || 'Unknown';
      const size = obj.Size || 0;
      const lastModified = obj.LastModified?.toISOString() || 'Unknown';
      const isFile = !key.endsWith('/');
      
      console.log(`   ${index + 1}. ${key}`);
      console.log(`      Size: ${size} bytes (${(size / 1024).toFixed(2)} KB)`);
      console.log(`      Last Modified: ${lastModified}`);
      console.log(`      Type: ${isFile ? 'File' : 'Folder'}`);
      
      // Test public URL access for files
      if (isFile && publicUrl) {
        const publicFileUrl = `${publicUrl}/${key}`;
        console.log(`      Public URL: ${publicFileUrl}`);
        
        // Test if file is accessible via public URL
        testFileAccess(publicFileUrl, key.split('/').pop() || 'Unknown');
      }
      
      console.log('   ' + '─'.repeat(50));
    });
    
    // 3. Get files from database
    console.log('\n2️⃣ Getting files from database...');
    const dbFiles = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${dbFiles.length} files in database\n`);
    
    // 4. Compare R2 vs Database
    console.log('3️⃣ Comparing R2 vs Database...');
    
    const r2Keys = new Set(r2Objects.map(obj => obj.Key).filter(Boolean));
    const dbKeys = new Set(dbFiles.map(file => file.r2Key));
    
    // Files in R2 but not in DB
    const inR2NotInDB = Array.from(r2Keys).filter(key => !dbKeys.has(key));
    if (inR2NotInDB.length > 0) {
      console.log(`   ⚠️  ${inR2NotInDB.length} files in R2 but not in database:`);
      inR2NotInDB.forEach(key => console.log(`      - ${key}`));
    }
    
    // Files in DB but not in R2
    const inDBNotInR2 = Array.from(dbKeys).filter(key => !r2Keys.has(key));
    if (inDBNotInR2.length > 0) {
      console.log(`   ❌ ${inDBNotInR2.length} files in database but not in R2:`);
      inDBNotInR2.forEach(key => console.log(`      - ${key}`));
    }
    
    // Matching files
    const matching = Array.from(r2Keys).filter(key => dbKeys.has(key));
    console.log(`   ✅ ${matching.length} files match between R2 and database`);
    
    // 5. Test public URL access for matching files
    if (matching.length > 0 && publicUrl) {
      console.log('\n4️⃣ Testing public URL access for matching files...\n');
      
      for (const r2Key of matching.slice(0, 3)) { // Test first 3 files
        const publicFileUrl = `${publicUrl}/${r2Key}`;
        const filename = r2Key.split('/').pop() || 'Unknown';
        
        console.log(`📁 Testing: ${filename}`);
        console.log(`   R2 Key: ${r2Key}`);
        console.log(`   Public URL: ${publicFileUrl}`);
        
        await testFileAccess(publicFileUrl, filename);
        console.log('   ' + '─'.repeat(50));
      }
    }
    
    // 6. Summary
    console.log('\n📊 Summary:');
    console.log(`   R2 Objects: ${r2Objects.length}`);
    console.log(`   Database Files: ${dbFiles.length}`);
    console.log(`   Matching Files: ${matching.length}`);
    console.log(`   Public URL: ${publicUrl ? '✅ Configured' : '❌ Not configured'}`);
    
    if (publicUrl) {
      console.log('\n🎯 Next Steps:');
      console.log('   1. Check if public URLs are accessible (200 OK)');
      console.log('   2. If 403 Forbidden, enable public access in R2 dashboard');
      console.log('   3. If 404 Not Found, check file paths');
      console.log('   4. Test your app at http://localhost:3000/files');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testFileAccess(url: string, filename: string) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'CompuCar-Debug/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log(`   ✅ File is accessible!`);
      console.log(`   📏 Size: ${response.headers.get('content-length')} bytes`);
      console.log(`   🏷️  Type: ${response.headers.get('content-type')}`);
    } else if (response.status === 403) {
      console.log(`   ❌ 403 Forbidden - Public access not enabled`);
    } else if (response.status === 404) {
      console.log(`   ❌ 404 Not Found - File path incorrect`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
    
  } catch (fetchError) {
    console.log(`   ❌ Fetch error: ${fetchError.message}`);
  }
}

testR2FileListing();
