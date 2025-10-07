#!/usr/bin/env npx tsx

/**
 * Create Super Admin User Script
 * Usage: npx tsx scripts/create-super-admin.ts
 * 
 * This script creates a super admin user with custom credentials
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createSuperAdmin() {
  try {
    console.log('🔧 Super Admin User Creation Tool');
    console.log('================================\n');
    
    // Get user input
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password: ');
    const firstName = await askQuestion('Enter first name: ');
    const lastName = await askQuestion('Enter last name: ');
    
    if (!email || !password || !firstName || !lastName) {
      console.log('❌ All fields are required!');
      process.exit(1);
    }
    
    console.log('\n🔍 Checking if user exists...\n');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log(`   Current role: ${existingUser.role}`);
      console.log(`   isAdmin: ${existingUser.isAdmin}`);
      
      const update = await askQuestion('\nDo you want to update this user to SUPER_ADMIN? (y/N): ');
      
      if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        process.exit(0);
      }
      
      // Update existing user to super admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'SUPER_ADMIN',
          isAdmin: true,
          password: await bcrypt.hash(password, 12),
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(),
          isActive: true,
        }
      });
      
      console.log(`\n✅ Updated existing user to SUPER_ADMIN`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   isAdmin: ${updatedUser.isAdmin}`);
      
    } else {
      // Create new super admin user
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          role: 'SUPER_ADMIN',
          isAdmin: true,
          emailVerified: new Date(),
          isActive: true,
        }
      });
      
      console.log(`\n✅ Created new SUPER_ADMIN user:`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   ID: ${adminUser.id}`);
    }
    
    console.log('\n🎉 Super Admin user ready!');
    console.log('📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Login URLs:');
    console.log('   Local: http://localhost:3000/auth/login');
    console.log('   Production: https://compucar.pro/auth/login');
    console.log('   Admin Panel: /admin');
    
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   1. Change the password after first login');
    console.log('   2. Use a strong password in production');
    console.log('   3. Keep admin credentials secure');
    
  } catch (error) {
    console.error('❌ Error creating super admin user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createSuperAdmin();
