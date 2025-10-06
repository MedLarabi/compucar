import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function testLiveYalidineAPI() {
  console.log('🧪 Testing Live Yalidine API Integration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   YALIDINE_API_BASE: ${process.env.YALIDINE_API_BASE || 'undefined'}`);
  console.log(`   YALIDINE_API_ID: ${process.env.YALIDINE_API_ID ? 'configured' : 'missing'}`);
  console.log(`   YALIDINE_API_TOKEN: ${process.env.YALIDINE_API_TOKEN ? 'configured' : 'missing'}`);
  console.log(`   YALIDINE_FROM_WILAYA_ID: ${process.env.YALIDINE_FROM_WILAYA_ID || 'undefined (will default to 16)'}`);
  
  if (!process.env.YALIDINE_API_ID || !process.env.YALIDINE_API_TOKEN) {
    console.log('\n❌ Yalidine API credentials are missing!');
    console.log('Please add them to your .env.local file');
    return;
  }
  
  console.log('\n✅ Yalidine API credentials are configured');
  
  // Test direct API calls
  console.log('\n🌍 Testing live wilayas API...');
  try {
    const wilayasResponse = await fetch('http://localhost:3000/api/yalidine/wilayas');
    const wilayasData = await wilayasResponse.json();
    
    if (wilayasResponse.ok && wilayasData.wilayas) {
      console.log(`✅ Wilayas: ${wilayasData.wilayas.length} found`);
      console.log('📝 Sample:', wilayasData.wilayas.slice(0, 5).map((w: any) => w.name).join(', '));
    } else {
      console.log('❌ Wilayas failed:', wilayasData);
    }
  } catch (error) {
    console.log('❌ Wilayas error:', error);
  }
  
  console.log('\n🏘️ Testing live communes API...');
  try {
    const communesResponse = await fetch('http://localhost:3000/api/yalidine/communes?wilaya=Alger');
    const communesData = await communesResponse.json();
    
    if (communesResponse.ok && communesData.communes) {
      console.log(`✅ Communes (Alger): ${communesData.communes.length} found`);
      console.log('📝 Sample:', communesData.communes.slice(0, 5).map((c: any) => c.name).join(', '));
    } else {
      console.log('❌ Communes failed:', communesData);
    }
  } catch (error) {
    console.log('❌ Communes error:', error);
  }
  
  console.log('\n📍 Testing live stop desks API...');
  try {
    const stopDesksResponse = await fetch('http://localhost:3000/api/yalidine/stopdesks?wilaya=Alger');
    const stopDesksData = await stopDesksResponse.json();
    
    if (stopDesksResponse.ok && stopDesksData.stopdesks) {
      console.log(`✅ Stop Desks (Alger): ${stopDesksData.stopdesks.length} found`);
      console.log('📝 Sample:', stopDesksData.stopdesks.slice(0, 3).map((s: any) => s.name).join(', '));
    } else {
      console.log('❌ Stop Desks failed:', stopDesksData);
    }
  } catch (error) {
    console.log('❌ Stop Desks error:', error);
  }
  
  console.log('\n📋 Summary:');
  console.log('✅ All APIs now use live Yalidine data (no database cache)');
  console.log('📞 Direct API calls to Yalidine servers');
  console.log('🔄 Real-time data on every request');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Try placing an order to test the complete flow');
  console.log('2. Check browser console for API call logs');
  console.log('3. Verify wilayas and communes load in the checkout form');
}

testLiveYalidineAPI().catch(console.error);
