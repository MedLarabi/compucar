import { S3Client, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugR2_403() {
  try {
    console.log('🔍 Debugging R2 403 Forbidden Error\n');
    
    // 1. Check R2 Configuration
    console.log('1️⃣ Checking R2 Configuration...');
    const r2Config = {
      endpoint: process.env.R2_ENDPOINT,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      accountId: process.env.R2_ACCOUNT_ID,
      region: process.env.R2_REGION || 'auto'
    };
    
    console.log('   Configuration:');
    Object.entries(r2Config).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${key.includes('KEY') ? '***' + value.slice(-4) : value}`);
      } else {
        console.log(`   ❌ ${key}: Not set`);
      }
    });
    
    if (!r2Config.endpoint || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucket) {
      console.log('\n❌ R2 not properly configured!');
      return;
    }
    
    // 2. Test R2 Client Connection
    console.log('\n2️⃣ Testing R2 Client Connection...');
    const r2Client = new S3Client({
      region: r2Config.region,
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      forcePathStyle: false,
    });
    
    try {
      // Test bucket access
      const listCommand = new ListObjectsV2Command({
        Bucket: r2Config.bucket,
        MaxKeys: 1
      });
      
      const listResponse = await r2Client.send(listCommand);
      console.log(`   ✅ Bucket access successful`);
      console.log(`   📊 Objects in bucket: ${listResponse.Contents?.length || 0}`);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        const sampleObject = listResponse.Contents[0];
        console.log(`   📁 Sample object: ${sampleObject.Key}`);
        console.log(`   📏 Size: ${sampleObject.Size} bytes`);
        console.log(`   📅 Last modified: ${sampleObject.LastModified}`);
      }
      
    } catch (bucketError) {
      console.log(`   ❌ Bucket access failed: ${bucketError.message}`);
      return;
    }
    
    // 3. Get files from database
    console.log('\n3️⃣ Getting files from database...');
    const files = await prisma.tuningFile.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${files.length} files in database`);
    
    if (files.length === 0) {
      console.log('   ❌ No files found in database');
      return;
    }
    
    // 4. Test each file's R2 access
    console.log('\n4️⃣ Testing individual file access...');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n   File ${i + 1}: ${file.originalFilename}`);
      console.log(`   R2 Key: ${file.r2Key}`);
      console.log(`   File Size: ${Number(file.fileSize)} bytes`);
      
      try {
        // Test HEAD request (check if object exists)
        console.log('   🔍 Testing HEAD request...');
        const headCommand = new HeadObjectCommand({
          Bucket: r2Config.bucket,
          Key: file.r2Key
        });
        
        const headResponse = await r2Client.send(headCommand);
        console.log(`   ✅ Object exists in R2`);
        console.log(`   📏 R2 Size: ${headResponse.ContentLength} bytes`);
        console.log(`   📅 Last Modified: ${headResponse.LastModified}`);
        console.log(`   🏷️  Content Type: ${headResponse.ContentType}`);
        
        // Test presigned URL generation
        console.log('   🔗 Testing presigned URL generation...');
        const getCommand = new GetObjectCommand({
          Bucket: r2Config.bucket,
          Key: file.r2Key
        });
        
        const presignedUrl = await getSignedUrl(r2Client, getCommand, { 
          expiresIn: 900 // 15 minutes
        });
        
        console.log(`   ✅ Presigned URL generated`);
        console.log(`   🔗 URL: ${presignedUrl.substring(0, 100)}...`);
        
        // Test URL accessibility
        console.log('   🌐 Testing URL accessibility...');
        try {
          const response = await fetch(presignedUrl, { 
            method: 'HEAD',
            headers: {
              'User-Agent': 'CompuCar-Debug/1.0'
            }
          });
          
          console.log(`   📊 Response Status: ${response.status}`);
          console.log(`   📋 Response Headers:`);
          response.headers.forEach((value, key) => {
            if (key.toLowerCase().includes('error') || key.toLowerCase().includes('x-')) {
              console.log(`      ${key}: ${value}`);
            }
          });
          
          if (response.status === 200) {
            console.log(`   ✅ File is accessible via presigned URL`);
          } else if (response.status === 403) {
            console.log(`   ❌ 403 Forbidden - Permission issue`);
            console.log(`   💡 Possible causes:`);
            console.log(`      - R2 bucket doesn't allow public access`);
            console.log(`      - Presigned URL signature is invalid`);
            console.log(`      - R2 key doesn't match actual object key`);
            console.log(`      - CORS policy is blocking the request`);
          } else if (response.status === 404) {
            console.log(`   ❌ 404 Not Found - Object doesn't exist`);
            console.log(`   💡 The R2 key might be incorrect`);
          } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
          }
          
        } catch (fetchError) {
          console.log(`   ❌ Fetch error: ${fetchError.message}`);
        }
        
      } catch (r2Error) {
        console.log(`   ❌ R2 error: ${r2Error.message}`);
        
        if (r2Error.name === 'NoSuchKey') {
          console.log(`   💡 The object doesn't exist in R2`);
        } else if (r2Error.name === 'AccessDenied') {
          console.log(`   💡 Access denied - check R2 permissions`);
        } else if (r2Error.name === 'InvalidAccessKeyId') {
          console.log(`   💡 Invalid access key - check R2 credentials`);
        }
      }
      
      console.log('   ' + '─'.repeat(50));
    }
    
    // 5. Recommendations
    console.log('\n5️⃣ Recommendations:');
    console.log('   🔧 If 403 Forbidden:');
    console.log('      1. Check R2 bucket public access settings');
    console.log('      2. Verify CORS configuration');
    console.log('      3. Ensure presigned URL generation is correct');
    console.log('      4. Check if R2 keys match actual object keys');
    
    console.log('\n   🔧 If 404 Not Found:');
    console.log('      1. Verify R2 key generation logic');
    console.log('      2. Check if files were actually uploaded');
    console.log('      3. Compare database R2 keys with actual R2 objects');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugR2_403();
