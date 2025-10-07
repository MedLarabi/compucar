import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testPublicUrl() {
  try {
    console.log('🧪 Testing R2 Public URL\n');
    
    const publicUrl = process.env.R2_PUBLIC_URL;
    console.log(`Public URL: ${publicUrl}`);
    
    if (!publicUrl) {
      console.log('❌ R2_PUBLIC_URL not set in environment variables');
      return;
    }
    
    // Test files that exist in R2
    const testFiles = [
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/6b818ced-dab0-4eb1-b876-1a8f8ab1c730_1759504224145_C3_eeprom_immo_OFF.bin',
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/6f378655-f5d6-4c54-9b1f-dc3f08194b6f_1759507874210_WinOLS_PEUGEOT_1.6HDI_FAP_EGR_ADDT.bin',
      'tuning-files/cme7o1ods0000vinsbj0gpn7q/ccf20261-6c4b-4d93-a03a-4c35e896b364_1759508979597_C3_eeprom_immo_OFF.bin'
    ];
    
    console.log(`\nTesting ${testFiles.length} files...\n`);
    
    for (let i = 0; i < testFiles.length; i++) {
      const r2Key = testFiles[i];
      const fullUrl = `${publicUrl}/${r2Key}`;
      const filename = r2Key.split('/').pop();
      
      console.log(`📁 File ${i + 1}: ${filename}`);
      console.log(`   R2 Key: ${r2Key}`);
      console.log(`   Full URL: ${fullUrl}`);
      
      try {
        console.log('   🌐 Testing URL accessibility...');
        
        const response = await fetch(fullUrl, { 
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
          console.log(`   🔗 Direct link: ${fullUrl}`);
        } else if (response.status === 403) {
          console.log(`   ❌ 403 Forbidden - Still has permission issues`);
        } else if (response.status === 404) {
          console.log(`   ❌ 404 Not Found - File doesn't exist at this URL`);
        } else {
          console.log(`   ⚠️  Unexpected status: ${response.status}`);
        }
        
      } catch (fetchError) {
        console.log(`   ❌ Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
      
      console.log('   ' + '─'.repeat(60));
    }
    
    console.log('\n🎯 Summary:');
    console.log('If all files show 200 OK, the public URL is working!');
    console.log('If you see 403 Forbidden, you need to enable public access in R2 dashboard.');
    console.log('If you see 404 Not Found, the file paths might be different.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPublicUrl();
