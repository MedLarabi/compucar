import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function testYalidineConfiguration() {
  console.log('🔍 Testing Yalidine API Configuration...\n');
  
  // Check environment variables
  const yalidineConfig = {
    base: process.env.YALIDINE_API_BASE,
    id: process.env.YALIDINE_API_ID,
    token: process.env.YALIDINE_API_TOKEN,
    fromWilayaId: process.env.YALIDINE_FROM_WILAYA_ID
  };
  
  console.log('📋 Environment Variables Status:');
  console.log(`   YALIDINE_API_BASE: ${yalidineConfig.base ? '✅ Set' : '❌ Missing'} (${yalidineConfig.base || 'undefined'})`);
  console.log(`   YALIDINE_API_ID: ${yalidineConfig.id ? '✅ Set' : '❌ Missing'} (${yalidineConfig.id ? '***masked***' : 'undefined'})`);
  console.log(`   YALIDINE_API_TOKEN: ${yalidineConfig.token ? '✅ Set' : '❌ Missing'} (${yalidineConfig.token ? '***masked***' : 'undefined'})`);
  console.log(`   YALIDINE_FROM_WILAYA_ID: ${yalidineConfig.fromWilayaId ? '✅ Set' : '❌ Missing'} (${yalidineConfig.fromWilayaId || 'undefined'})`);
  
  if (!yalidineConfig.id || !yalidineConfig.token) {
    console.log('\n❌ Yalidine API credentials are missing!');
    console.log('\n📋 To fix this:');
    console.log('1. Get your API credentials from: https://yalidine.app/developers');
    console.log('2. Add them to your .env.local file:');
    console.log('   YALIDINE_API_BASE=https://api.yalidine.app/v1/');
    console.log('   YALIDINE_API_ID=your_api_id_here');
    console.log('   YALIDINE_API_TOKEN=your_api_token_here');
    console.log('   YALIDINE_FROM_WILAYA_ID=16');
    console.log('3. Restart your development server');
    return false;
  }
  
  console.log('\n✅ All Yalidine environment variables are configured!');
  return true;
}

async function testWilayasAPI() {
  console.log('\n🌍 Testing Wilayas API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/yalidine/wilayas');
    const data = await response.json();
    
    if (response.ok && data.wilayas) {
      console.log(`✅ Wilayas API working: ${data.wilayas.length} wilayas found`);
      console.log('📝 Sample wilayas:', data.wilayas.slice(0, 5).map((w: any) => w.name).join(', '));
      return true;
    } else {
      console.log('❌ Wilayas API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing Wilayas API:', error);
    return false;
  }
}

async function testStopDesksAPI() {
  console.log('\n📍 Testing Stop Desks API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/yalidine/stopdesks?wilaya=Alger');
    const data = await response.json();
    
    if (response.ok && data.stopdesks) {
      console.log(`✅ Stop Desks API working: ${data.stopdesks.length} stop desks found for Alger`);
      console.log('📝 Sample stop desks:', data.stopdesks.slice(0, 3).map((s: any) => s.name).join(', '));
      return true;
    } else {
      console.log('❌ Stop Desks API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing Stop Desks API:', error);
    return false;
  }
}

async function testCommunesAPI() {
  console.log('\n🏘️ Testing Communes API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/yalidine/communes?wilaya=Alger');
    const data = await response.json();
    
    if (response.ok && data.communes) {
      console.log(`✅ Communes API working: ${data.communes.length} communes found for Alger`);
      console.log('📝 Sample communes:', data.communes.slice(0, 5).map((c: any) => c.name).join(', '));
      return true;
    } else {
      console.log('❌ Communes API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing Communes API:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Yalidine API Diagnostic Tool\n');
  
  // Test configuration
  const configOk = await testYalidineConfiguration();
  
  if (!configOk) {
    console.log('\n⚠️  Cannot test APIs without proper configuration');
    return;
  }
  
  // Test APIs
  const wilayasOk = await testWilayasAPI();
  const stopDesksOk = await testStopDesksAPI();
  const communesOk = await testCommunesAPI();
  
  console.log('\n📊 Summary:');
  console.log(`🌍 Wilayas API: ${wilayasOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`📍 Stop Desks API: ${stopDesksOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`🏘️ Communes API: ${communesOk ? '✅ Working' : '❌ Failed'}`);
  
  if (wilayasOk && stopDesksOk && communesOk) {
    console.log('\n🎉 All Yalidine APIs are working correctly!');
    console.log('✅ You should be able to place orders with live shipping data');
  } else {
    console.log('\n⚠️  Some APIs are not working. Check the errors above.');
    console.log('💡 The system will fall back to cached/mock data for failed APIs');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure your development server is running (npm run dev)');
  console.log('2. Try placing an order to test the complete flow');
  console.log('3. Check browser console for any additional errors');
}

main().catch(console.error);
