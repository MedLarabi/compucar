#!/usr/bin/env npx tsx

/**
 * Production NextAuth Diagnostic Script
 * Run this on your production server to diagnose authentication issues
 * Usage: npx tsx scripts/diagnose-production-auth.ts
 */

import { config } from '../src/lib/auth/config';
import { prisma } from '../src/lib/database/prisma';

async function diagnoseProductionAuth() {
  console.log('🔍 NextAuth Production Diagnostic');
  console.log('=================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node Version: ${process.version}`);
  console.log('');

  // 1. Environment Variables Check
  console.log('📋 1. Environment Variables');
  console.log('---------------------------');
  
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'DATABASE_URL'
  ];

  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'GITHUB_ID',
    'GITHUB_SECRET'
  ];

  let envIssues = 0;

  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`❌ ${varName}: MISSING`);
      envIssues++;
    } else {
      console.log(`✅ ${varName}: ${varName === 'NEXTAUTH_SECRET' || varName === 'DATABASE_URL' ? 'SET (hidden)' : value}`);
    }
  });

  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`ℹ️  ${varName}: ${value ? 'SET' : 'NOT SET'}`);
  });

  // 2. NextAuth URL Validation
  console.log('\n🌐 2. NextAuth URL Validation');
  console.log('-----------------------------');
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      console.log(`✅ NEXTAUTH_URL is valid: ${url.href}`);
      console.log(`   Protocol: ${url.protocol}`);
      console.log(`   Host: ${url.host}`);
      
      if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        console.log('⚠️  Warning: Using HTTP in production (should use HTTPS)');
      }
    } catch (error) {
      console.log(`❌ NEXTAUTH_URL is invalid: ${nextAuthUrl}`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      envIssues++;
    }
  }

  // 3. Database Connection Test
  console.log('\n🗄️  3. Database Connection');
  console.log('-------------------------');
  
  try {
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible (${userCount} users)`);

    // Test NextAuth tables
    try {
      const accountCount = await prisma.account.count();
      console.log(`✅ Account table accessible (${accountCount} accounts)`);
    } catch (error) {
      console.log(`❌ Account table issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const sessionCount = await prisma.session.count();
      console.log(`✅ Session table accessible (${sessionCount} sessions)`);
    } catch (error) {
      console.log(`❌ Session table issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' },
          { isAdmin: true }
        ]
      }
    });

    if (adminUser) {
      console.log(`✅ Admin user found: ${adminUser.email} (${adminUser.role})`);
    } else {
      console.log('⚠️  No admin user found');
    }

  } catch (error) {
    console.log(`❌ Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    envIssues++;
  }

  // 4. NextAuth Configuration Test
  console.log('\n⚙️  4. NextAuth Configuration');
  console.log('----------------------------');
  
  try {
    console.log(`✅ Providers configured: ${config.providers?.length || 0}`);
    console.log(`✅ Adapter configured: ${!!config.adapter}`);
    console.log(`✅ Session strategy: ${config.session?.strategy}`);
    console.log(`✅ Debug mode: ${config.debug}`);
    
    if (config.pages) {
      console.log(`✅ Custom pages configured:`);
      Object.entries(config.pages).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }

    // Test auth handlers import
    const { handlers, auth } = await import('../src/lib/auth/config');
    console.log(`✅ Auth handlers exported: ${!!handlers}`);
    console.log(`✅ Auth function exported: ${!!auth}`);

  } catch (error) {
    console.log(`❌ NextAuth configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    envIssues++;
  }

  // 5. Cookie Configuration
  console.log('\n🍪 5. Cookie Configuration');
  console.log('-------------------------');
  
  if (config.cookies?.sessionToken) {
    const cookieConfig = config.cookies.sessionToken;
    console.log(`✅ Session token name: ${cookieConfig.name}`);
    console.log(`✅ HTTP Only: ${cookieConfig.options?.httpOnly}`);
    console.log(`✅ Secure: ${cookieConfig.options?.secure}`);
    console.log(`✅ SameSite: ${cookieConfig.options?.sameSite}`);
  } else {
    console.log('ℹ️  Using default cookie configuration');
  }

  // 6. Production-specific Checks
  console.log('\n🏭 6. Production Environment Checks');
  console.log('----------------------------------');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Running in production mode');
    
    // Check secure cookies
    if (config.cookies?.sessionToken?.options?.secure) {
      console.log('✅ Secure cookies enabled');
    } else {
      console.log('⚠️  Secure cookies not explicitly enabled');
    }

    // Check HTTPS
    if (process.env.NEXTAUTH_URL?.startsWith('https://')) {
      console.log('✅ HTTPS URL configured');
    } else {
      console.log('❌ HTTPS URL not configured (required for production)');
      envIssues++;
    }

    // Check debug mode
    if (!config.debug) {
      console.log('✅ Debug mode disabled');
    } else {
      console.log('⚠️  Debug mode enabled in production');
    }
  } else {
    console.log(`ℹ️  Running in ${process.env.NODE_ENV} mode`);
  }

  // 7. Summary and Recommendations
  console.log('\n📊 7. Summary and Recommendations');
  console.log('---------------------------------');
  
  if (envIssues === 0) {
    console.log('🎉 All checks passed! Your NextAuth configuration looks good.');
  } else {
    console.log(`❌ Found ${envIssues} critical issues that need to be fixed.`);
  }

  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Ensure all required environment variables are set');
  console.log('2. Check that NEXTAUTH_URL matches your domain exactly');
  console.log('3. Verify database connection and tables exist');
  console.log('4. Check server logs for more detailed error messages');
  console.log('5. Try clearing browser cookies and cache');

  console.log('\n🌐 Test URLs:');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  console.log(`Auth Session: ${baseUrl}/api/auth/session`);
  console.log(`Sign In: ${baseUrl}/api/auth/signin`);
  console.log(`Auth Providers: ${baseUrl}/api/auth/providers`);

  await prisma.$disconnect();
}

diagnoseProductionAuth().catch(console.error);
