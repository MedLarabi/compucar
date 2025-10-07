import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testExistingFiles() {
  try {
    console.log('🧪 Testing presigned URLs for existing R2 files\n');
    
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
    
    console.log(`Bucket name: ${bucketName}`);
    console.log(`R2 Endpoint: ${process.env.R2_ENDPOINT}`);
    console.log(`R2 Region: ${process.env.R2_REGION || 'auto'}`);
    
    // Files that exist in R2 (from previous analysis)
    const existingFiles = [
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/6b818ced-dab0-4eb1-b876-1a8f8ab1c730_1759504224145_C3_eeprom_immo_OFF.bin',
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/6f378655-f5d6-4c54-9b1f-dc3f08194b6f_1759507874210_WinOLS_PEUGEOT_1.6HDI_FAP_EGR_ADDT.bin',
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/ccf20261-6c4b-4d93-a03a-4c35e896b364_1759508979597_C3_eeprom_immo_OFF.bin'
    ];
    
    console.log(`Testing ${existingFiles.length} files that exist in R2...\n`);
    
    for (let i = 0; i < existingFiles.length; i++) {
      const r2Key = existingFiles[i];
      console.log(`📁 File ${i + 1}: ${r2Key.split('/').pop()}`);
      console.log(`   R2 Key: ${r2Key}`);
      
      try {
        // Generate presigned URL
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: r2Key
        });
        
        const presignedUrl = await getSignedUrl(r2Client, getCommand, { 
          expiresIn: 900 // 15 minutes
        });
        
        console.log(`   ✅ Presigned URL generated`);
        console.log(`   🔗 URL: ${presignedUrl.substring(0, 80)}...`);
        
        // Test URL accessibility
        console.log(`   🌐 Testing URL accessibility...`);
        
        try {
          const response = await fetch(presignedUrl, { 
            method: 'HEAD',
            headers: {
              'User-Agent': 'CompuCar-Debug/1.0'
            }
          });
          
          console.log(`   📊 Status: ${response.status} ${response.statusText}`);
          
          if (response.status === 200) {
            console.log(`   ✅ File is accessible!`);
            console.log(`   📏 Content-Length: ${response.headers.get('content-length')} bytes`);
            console.log(`   🏷️  Content-Type: ${response.headers.get('content-type')}`);
          } else if (response.status === 403) {
            console.log(`   ❌ 403 Forbidden`);
            
            // Check response headers for more info
            console.log(`   📋 Response Headers:`);
            response.headers.forEach((value, key) => {
              if (key.toLowerCase().includes('error') || 
                  key.toLowerCase().includes('x-') ||
                  key.toLowerCase().includes('cf-')) {
                console.log(`      ${key}: ${value}`);
              }
            });
            
            // Try to get more details about the error
            try {
              const errorResponse = await fetch(presignedUrl, { 
                method: 'GET',
                headers: {
                  'User-Agent': 'CompuCar-Debug/1.0'
                }
              });
              
              const errorText = await errorResponse.text();
              console.log(`   📄 Error Response: ${errorText.substring(0, 200)}...`);
            } catch (e) {
              console.log(`   📄 Could not fetch error details: ${e instanceof Error ? e.message : String(e)}`);
            }
            
          } else if (response.status === 404) {
            console.log(`   ❌ 404 Not Found - File doesn't exist`);
          } else {
            console.log(`   ⚠️  Unexpected status: ${response.status}`);
          }
          
        } catch (fetchError) {
          console.log(`   ❌ Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }
        
      } catch (r2Error) {
        console.log(`   ❌ R2 error: ${r2Error instanceof Error ? r2Error.message : String(r2Error)}`);
      }
      
      console.log('   ' + '─'.repeat(60));
    }
    
    // Test with different presigned URL options
    console.log('\n🔧 Testing different presigned URL configurations...\n');
    
    const testKey = existingFiles[0];
    console.log(`Testing with file: ${testKey.split('/').pop()}`);
    
    // Test 1: Basic presigned URL
    console.log('1️⃣ Basic presigned URL:');
    try {
      const basicCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      
      const basicUrl = await getSignedUrl(r2Client, basicCommand, { 
        expiresIn: 900
      });
      
      console.log(`   URL: ${basicUrl.substring(0, 80)}...`);
      
      const basicResponse = await fetch(basicUrl, { method: 'HEAD' });
      console.log(`   Status: ${basicResponse.status}`);
      
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 2: With response content disposition
    console.log('\n2️⃣ With response content disposition:');
    try {
      const dispositionCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        ResponseContentDisposition: 'attachment; filename="test.bin"'
      });
      
      const dispositionUrl = await getSignedUrl(r2Client, dispositionCommand, { 
        expiresIn: 900
      });
      
      console.log(`   URL: ${dispositionUrl.substring(0, 80)}...`);
      
      const dispositionResponse = await fetch(dispositionUrl, { method: 'HEAD' });
      console.log(`   Status: ${dispositionResponse.status}`);
      
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 3: With different expiration
    console.log('\n3️⃣ With longer expiration (1 hour):');
    try {
      const longCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      });
      
      const longUrl = await getSignedUrl(r2Client, longCommand, { 
        expiresIn: 3600 // 1 hour
      });
      
      console.log(`   URL: ${longUrl.substring(0, 80)}...`);
      
      const longResponse = await fetch(longUrl, { method: 'HEAD' });
      console.log(`   Status: ${longResponse.status}`);
      
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('\n💡 If all tests show 403, the issue is likely:');
    console.log('   1. R2 bucket permissions (not allowing public access)');
    console.log('   2. CORS configuration');
    console.log('   3. Cloudflare R2 account settings');
    console.log('   4. Presigned URL signature validation');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testExistingFiles();
