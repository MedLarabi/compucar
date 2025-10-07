#!/usr/bin/env npx tsx

/**
 * Production Environment Test
 * Run this on your production server to test the exact same environment
 */

console.log('🏭 PRODUCTION ENVIRONMENT TEST');
console.log('==============================');
console.log(`Node Version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log('');

async function testProductionEnvironment() {
  // Test 1: Environment Variables
  console.log('📋 1. Environment Variables Check');
  console.log('---------------------------------');
  
  const requiredVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'DATABASE_URL'];
  let envErrors = 0;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: NOT SET`);
      envErrors++;
    } else {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') ? 'SET (hidden)' : value}`);
    }
  });
  
  // Test 2: Database Connection
  console.log('\n🗄️  2. Database Connection Test');
  console.log('------------------------------');
  
  try {
    const { prisma } = await import('../src/lib/database/prisma');
    await prisma.$connect();
    
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected: ${userCount} users found`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log(`❌ Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    envErrors++;
  }
  
  // Test 3: NextAuth Import Test  
  console.log('\n⚙️  3. NextAuth Configuration Test');
  console.log('----------------------------------');
  
  try {
    const { config, handlers, auth } = await import('../src/lib/auth/config');
    
    console.log('✅ NextAuth config imported');
    console.log(`✅ Providers: ${config.providers?.length || 0}`);
    console.log(`✅ Adapter: ${config.adapter ? 'configured' : 'not configured'}`);
    console.log(`✅ Handlers: ${handlers ? 'exported' : 'not exported'}`);
    
    // Test handlers specifically
    if (handlers && typeof handlers.GET === 'function' && typeof handlers.POST === 'function') {
      console.log('✅ GET/POST handlers are functions');
    } else {
      console.log('❌ Handlers are not properly exported');
      envErrors++;
    }
    
  } catch (error) {
    console.log(`❌ NextAuth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   Stack: ${error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : 'No stack'}`);
    envErrors++;
  }
  
  // Test 4: Route Handler Test
  console.log('\n🛣️  4. Route Handler Test');
  console.log('------------------------');
  
  try {
    const routeHandler = await import('../src/app/api/auth/[...nextauth]/route');
    
    if (routeHandler.GET && routeHandler.POST) {
      console.log('✅ Route handlers exported correctly');
      console.log(`   GET: ${typeof routeHandler.GET}`);
      console.log(`   POST: ${typeof routeHandler.POST}`);
    } else {
      console.log('❌ Route handlers not properly exported');
      envErrors++;
    }
    
  } catch (error) {
    console.log(`❌ Route handler error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    envErrors++;
  }
  
  // Test 5: Production-specific checks
  console.log('\n🔒 5. Production Security Checks');
  console.log('--------------------------------');
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    if (nextAuthUrl.startsWith('https://')) {
      console.log('✅ HTTPS URL configured');
    } else {
      console.log('⚠️  HTTP URL in production (should use HTTPS)');
    }
    
    if (nextAuthUrl.endsWith('/')) {
      console.log('⚠️  NEXTAUTH_URL ends with slash (remove trailing slash)');
    } else {
      console.log('✅ NEXTAUTH_URL format correct');
    }
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  
  if (envErrors === 0) {
    console.log('🎉 All tests passed! Configuration should work in production.');
    console.log('\nIf you\'re still getting 500 errors, the issue might be:');
    console.log('1. Application not restarted after environment changes');
    console.log('2. Different environment file being loaded');
    console.log('3. Runtime errors during request handling');
    console.log('4. Permissions issues with files/database');
  } else {
    console.log(`❌ Found ${envErrors} critical issues that need fixing.`);
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Fix the issues listed above');
    console.log('2. Restart your application completely');
    console.log('3. Check server logs for runtime errors');
  }
  
  console.log('\n🧪 MANUAL TEST:');
  console.log('After fixing issues, test manually:');
  console.log(`curl -v "${process.env.NEXTAUTH_URL || 'https://compucar.pro'}/api/auth/session"`);
}

testProductionEnvironment().catch(console.error);
