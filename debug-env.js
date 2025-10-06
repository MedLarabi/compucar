// Simple test to check environment loading
console.log('🔍 Environment Variables Check:');
console.log('YALIDINE_API_BASE:', process.env.YALIDINE_API_BASE || 'undefined');
console.log('YALIDINE_API_ID:', process.env.YALIDINE_API_ID ? 'configured' : 'undefined');
console.log('YALIDINE_API_TOKEN:', process.env.YALIDINE_API_TOKEN ? 'configured' : 'undefined');
console.log('YALIDINE_FROM_WILAYA_ID:', process.env.YALIDINE_FROM_WILAYA_ID || 'undefined');

// Test API call
async function testAPI() {
  try {
    console.log('\n🌍 Testing wilayas API...');
    const response = await fetch('http://localhost:3000/api/yalidine/wilayas');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.wilayas && data.wilayas.length > 0) {
      console.log(`Found ${data.wilayas.length} wilayas`);
      console.log('First few:', data.wilayas.slice(0, 3).map((w: any) => w.name));
    }
  } catch (error) {
    console.error('API test error:', error);
  }
}

testAPI();
