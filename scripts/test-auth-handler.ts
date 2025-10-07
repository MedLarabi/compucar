#!/usr/bin/env npx tsx

/**
 * Test NextAuth Route Handler
 * This script tests if the NextAuth route handler can be imported and initialized
 */

console.log('🧪 Testing NextAuth Route Handler');
console.log('=================================');

async function testRouteHandler() {
  try {
    console.log('1. Testing auth config import...');
    const authConfig = await import('../src/lib/auth/config');
    console.log('✅ Auth config imported successfully');
    
    console.log('2. Testing route handler import...');
    const routeHandler = await import('../src/app/api/auth/[...nextauth]/route');
    console.log('✅ Route handler imported successfully');
    
    console.log('3. Checking exports...');
    console.log(`   - GET handler: ${typeof routeHandler.GET}`);
    console.log(`   - POST handler: ${typeof routeHandler.POST}`);
    
    if (typeof routeHandler.GET !== 'function' || typeof routeHandler.POST !== 'function') {
      throw new Error('Route handlers are not properly exported');
    }
    
    console.log('4. Testing auth config properties...');
    const { config, handlers, auth } = authConfig;
    
    console.log(`   - Config object: ${!!config}`);
    console.log(`   - Handlers object: ${!!handlers}`);
    console.log(`   - Auth function: ${!!auth}`);
    console.log(`   - Providers: ${config?.providers?.length || 0}`);
    console.log(`   - Adapter: ${!!config?.adapter}`);
    
    console.log('\n✅ All tests passed! NextAuth should work correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    console.log('\n🔧 This indicates a configuration issue that needs to be fixed.');
    process.exit(1);
  }
}

testRouteHandler();
