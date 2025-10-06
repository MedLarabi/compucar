import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables the same way as in our services
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

console.log('🔍 Checking Yalidine Environment Variables...\n');

console.log('📋 Current Environment Variables:');
console.log(`YALIDINE_API_BASE: ${process.env.YALIDINE_API_BASE || 'undefined'}`);
console.log(`YALIDINE_API_ID: ${process.env.YALIDINE_API_ID ? 'configured (' + process.env.YALIDINE_API_ID.substring(0, 10) + '...)' : 'undefined'}`);
console.log(`YALIDINE_API_TOKEN: ${process.env.YALIDINE_API_TOKEN ? 'configured (' + process.env.YALIDINE_API_TOKEN.substring(0, 10) + '...)' : 'undefined'}`);
console.log(`YALIDINE_FROM_WILAYA_ID: ${process.env.YALIDINE_FROM_WILAYA_ID || 'undefined'}`);

// Test the actual function from the client
async function testYalidineFunction() {
  console.log('\n🧪 Testing yalidineGetWilayas function directly...');
  
  // Import the function
  const { yalidineGetWilayas } = await import('../src/lib/yalidine/client');
  
  const result = await yalidineGetWilayas();
  
  console.log('📦 Result:', {
    ok: result.ok,
    dataLength: result.data?.length || 0,
    error: result.error,
    firstFewWilayas: result.data?.slice(0, 3).map(w => w.name) || []
  });
  
  if (result.data && result.data.length === 58) {
    console.log('⚠️  Getting fallback data (58 static wilayas) - API credentials issue');
  } else if (result.data && result.data.length > 0) {
    console.log('✅ Getting live API data');
  } else {
    console.log('❌ No data returned');
  }
}

testYalidineFunction().catch(console.error);
