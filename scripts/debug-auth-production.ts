#!/usr/bin/env npx tsx

/**
 * Debug script to test NextAuth configuration in production
 * Run with: npx tsx scripts/debug-auth-production.ts
 */

import { config } from '../src/lib/auth/config';
import { prisma } from '../src/lib/database/prisma';

async function debugAuth() {
  console.log('🔍 Debugging NextAuth Production Configuration');
  console.log('===============================================');
  
  // 1. Check environment variables
  console.log('\n1. Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Present' : '❌ Missing');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Present' : '❌ Missing');
  
  // 2. Test database connection
  console.log('\n2. Database Connection:');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if User table exists
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible (${userCount} users)`);
    
    // Test if NextAuth tables exist
    try {
      const accountCount = await prisma.account.count();
      console.log(`✅ Account table accessible (${accountCount} accounts)`);
    } catch (error) {
      console.log('❌ Account table missing or inaccessible');
    }
    
    try {
      const sessionCount = await prisma.session.count();
      console.log(`✅ Session table accessible (${sessionCount} sessions)`);
    } catch (error) {
      console.log('❌ Session table missing or inaccessible');
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error);
  }
  
  // 3. Check auth configuration
  console.log('\n3. Auth Configuration:');
  console.log('Providers configured:', config.providers?.length || 0);
  console.log('Adapter configured:', !!config.adapter);
  console.log('Session strategy:', config.session?.strategy);
  console.log('Debug mode:', config.debug);
  
  // 4. Test minimal auth config
  console.log('\n4. Testing Minimal Auth Config:');
  try {
    // Test if the config can be imported without errors
    const { auth, handlers } = await import('../src/lib/auth/config');
    console.log('✅ Auth config imports successfully');
    console.log('✅ Handlers exported:', !!handlers);
    console.log('✅ Auth function exported:', !!auth);
  } catch (error) {
    console.log('❌ Auth config import failed:', error);
  }
  
  // 5. Recommendations
  console.log('\n5. Recommendations:');
  if (!process.env.NEXTAUTH_SECRET) {
    console.log('❌ Add NEXTAUTH_SECRET to your .env file');
  }
  if (!process.env.NEXTAUTH_URL) {
    console.log('❌ Add NEXTAUTH_URL to your .env file');
  }
  if (process.env.NODE_ENV === 'production' && config.debug) {
    console.log('⚠️  Disable debug mode in production');
  }
  
  console.log('\n✅ Diagnostic complete!');
  
  await prisma.$disconnect();
}

debugAuth().catch(console.error);
