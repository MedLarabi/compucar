import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkR2Objects() {
  try {
    console.log('🔍 Checking R2 Objects vs Database\n');
    
    // R2 Client
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
    
    // Get all objects from R2
    console.log('1️⃣ Fetching all objects from R2...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000
    });
    
    const r2Response = await r2Client.send(listCommand);
    const r2Objects = r2Response.Contents || [];
    
    console.log(`   Found ${r2Objects.length} objects in R2`);
    
    // Get all files from database
    console.log('\n2️⃣ Fetching all files from database...');
    const dbFiles = await prisma.tuningFile.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Found ${dbFiles.length} files in database`);
    
    // Compare
    console.log('\n3️⃣ Comparing R2 objects with database...');
    
    const r2Keys = new Set(r2Objects.map(obj => obj.Key).filter(Boolean));
    const dbKeys = new Set(dbFiles.map(file => file.r2Key));
    
    console.log('\n   📊 R2 Objects:');
    r2Objects.forEach((obj, index) => {
      console.log(`   ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
    });
    
    console.log('\n   📊 Database Files:');
    dbFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.r2Key} (${file.fileSize} bytes)`);
    });
    
    console.log('\n   🔍 Comparison:');
    
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
    
    // Check if the issue is with the R2 key format
    console.log('\n4️⃣ Analyzing R2 key patterns...');
    
    const r2KeyPatterns = r2Objects.map(obj => {
      const key = obj.Key || '';
      const parts = key.split('/');
      return {
        key,
        parts: parts.length,
        hasUserId: parts[1]?.startsWith('cme'),
        hasUuid: parts[2]?.includes('-'),
        pattern: parts.slice(0, 3).join('/')
      };
    });
    
    console.log('   R2 Key patterns:');
    r2KeyPatterns.forEach((pattern, index) => {
      console.log(`   ${index + 1}. ${pattern.key}`);
      console.log(`      Parts: ${pattern.parts}, Has UserId: ${pattern.hasUserId}, Has UUID: ${pattern.hasUuid}`);
      console.log(`      Pattern: ${pattern.pattern}`);
    });
    
    // Check database key patterns
    console.log('\n   Database key patterns:');
    dbFiles.slice(0, 3).forEach((file, index) => {
      const key = file.r2Key;
      const parts = key.split('/');
      console.log(`   ${index + 1}. ${key}`);
      console.log(`      Parts: ${parts.length}, Has UserId: ${parts[1]?.startsWith('cme')}, Has UUID: ${parts[2]?.includes('-')}`);
    });
    
    // The issue might be that the R2 objects have a different key structure
    console.log('\n5️⃣ Key Structure Analysis:');
    
    if (r2Objects.length > 0) {
      const firstR2Object = r2Objects[0];
      console.log(`   First R2 object: "${firstR2Object.Key}"`);
      
      // Check if it's a folder
      if (firstR2Object.Key?.endsWith('/')) {
        console.log('   ⚠️  This appears to be a folder, not a file');
        console.log('   💡 The issue might be that files are stored in a subfolder');
      }
    }
    
    // Check if we need to look deeper
    if (r2Objects.length === 1 && r2Objects[0].Key?.endsWith('/')) {
      console.log('\n6️⃣ Checking for files in subfolders...');
      
      // List objects with prefix
      const subfolderCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'tuning-files/',
        MaxKeys: 1000
      });
      
      const subfolderResponse = await r2Client.send(subfolderCommand);
      const subfolderObjects = subfolderResponse.Contents || [];
      
      console.log(`   Found ${subfolderObjects.length} objects in tuning-files/ folder`);
      
      subfolderObjects.forEach((obj, index) => {
        console.log(`   ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
      });
      
      // Now compare with database
      const subfolderKeys = new Set(subfolderObjects.map(obj => obj.Key).filter(Boolean));
      const matchingSubfolder = Array.from(subfolderKeys).filter(key => dbKeys.has(key));
      
      console.log(`\n   ✅ ${matchingSubfolder.length} files match in subfolder`);
      
      if (matchingSubfolder.length > 0) {
        console.log('   🎉 Files are found in the subfolder!');
        console.log('   💡 The issue might be with the presigned URL generation or CORS');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkR2Objects();
