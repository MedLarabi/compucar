#!/usr/bin/env npx tsx

/**
 * Quick Production Auth Debug Script
 * Run this on your production server to identify the exact issue
 * Usage: npx tsx scripts/quick-auth-debug.ts
 */

console.log('🚨 PRODUCTION AUTH DEBUG - QUICK DIAGNOSTIC');
console.log('===========================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('');

// 1. Critical Environment Variables
console.log('🔑 Critical Environment Variables:');
console.log('----------------------------------');

const criticalVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? 'SET (length: ' + process.env.NEXTAUTH_SECRET.length + ')' : 'NOT SET',
  'DATABASE_URL': process.env.DATABASE_URL ? 'SET' : 'NOT SET'
};

let hasErrors = false;

Object.entries(criticalVars).forEach(([key, value]) => {
  if (!value || value === 'NOT SET') {
    console.log(`❌ ${key}: ${value || 'MISSING'}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
});

// 2. Quick Database Test
console.log('\n🗄️  Database Connection Test:');
console.log('-----------------------------');

async function testDatabase() {
  try {
    const { prisma } = await import('../src/lib/database/prisma');
    
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Quick user count
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible: ${userCount} users found`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    hasErrors = true;
    return false;
  }
}

// 3. NextAuth Config Test
console.log('\n⚙️  NextAuth Configuration Test:');
console.log('--------------------------------');

async function testNextAuthConfig() {
  try {
    const { config, handlers, auth } = await import('../src/lib/auth/config');
    
    console.log(`✅ Config imported successfully`);
    console.log(`✅ Providers: ${config.providers?.length || 0}`);
    console.log(`✅ Adapter: ${config.adapter ? 'SET' : 'NOT SET'}`);
    console.log(`✅ Handlers: ${handlers ? 'EXPORTED' : 'NOT EXPORTED'}`);
    console.log(`✅ Auth function: ${typeof auth === 'function' ? 'EXPORTED' : 'NOT EXPORTED'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ NextAuth config error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    hasErrors = true;
    return false;
  }
}

// 4. URL Validation
console.log('\n🌐 URL Validation:');
console.log('------------------');

function validateUrls() {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    console.log('❌ NEXTAUTH_URL not set');
    hasErrors = true;
    return false;
  }
  
  try {
    const url = new URL(nextAuthUrl);
    console.log(`✅ NEXTAUTH_URL valid: ${url.href}`);
    
    if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      console.log('⚠️  WARNING: Using HTTP in production');
    }
    
    console.log(`✅ Expected session URL: ${url.href}/api/auth/session`);
    return true;
  } catch (error) {
    console.log(`❌ Invalid NEXTAUTH_URL: ${nextAuthUrl}`);
    hasErrors = true;
    return false;
  }
}

// Run all tests
async function runDiagnostic() {
  validateUrls();
  
  const dbOk = await testDatabase();
  const authOk = await testNextAuthConfig();
  
  console.log('\n📊 SUMMARY:');
  console.log('===========');
  
  if (hasErrors) {
    console.log('❌ CRITICAL ISSUES FOUND - Authentication will fail');
    console.log('\n🔧 IMMEDIATE ACTIONS NEEDED:');
    
    if (!process.env.NEXTAUTH_SECRET) {
      console.log('1. Add NEXTAUTH_SECRET to your .env file');
    }
    if (!process.env.NEXTAUTH_URL) {
      console.log('2. Add NEXTAUTH_URL to your .env file');
    }
    if (!dbOk) {
      console.log('3. Fix database connection issues');
    }
    if (!authOk) {
      console.log('4. Fix NextAuth configuration errors');
    }
    
    console.log('\n🚨 QUICK FIX - Add these to your production .env:');
    console.log('NEXTAUTH_SECRET="LN0AD4kA8Ljjp1Xcdh03D7tFBJX/GYjqYGz8uULqRqE="');
    console.log('NEXTAUTH_URL="https://compucar.pro"');
    console.log('NODE_ENV="production"');
    
  } else {
    console.log('✅ All checks passed - Configuration looks good');
    console.log('\n🔍 If still getting 500 errors, check:');
    console.log('1. Server logs for detailed error messages');
    console.log('2. Ensure application was restarted after changes');
    console.log('3. Check if there are any runtime errors in the auth handlers');
  }
  
  console.log('\n🌐 Test this URL directly:');
  console.log(`curl -v "https://compucar.pro/api/auth/session"`);
}

runDiagnostic().catch(console.error);
