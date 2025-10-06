#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';
import bcrypt from 'bcryptjs';

async function restoreUserData() {
  try {
    console.log('🔄 User Data Restoration Helper');
    console.log('================================\n');
    
    console.log('This script will help you recreate your user account and data.');
    console.log('Please provide the following information:\n');
    
    // You can modify these values to match your original account
    const userEmail = 'your-email@example.com'; // CHANGE THIS TO YOUR EMAIL
    const userPassword = 'your-password'; // CHANGE THIS TO YOUR PASSWORD
    const userFirstName = 'Your'; // CHANGE THIS TO YOUR FIRST NAME
    const userLastName = 'Name'; // CHANGE THIS TO YOUR LAST NAME
    
    console.log('📝 Current settings:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Name: ${userFirstName} ${userLastName}`);
    console.log(`   Password: ${userPassword}\n`);
    
    console.log('⚠️  To use this script:');
    console.log('1. Edit this file (scripts/restore-user-data.ts)');
    console.log('2. Change the userEmail, userPassword, userFirstName, userLastName variables');
    console.log('3. Run the script again\n');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (existingUser) {
      console.log(`✅ User ${userEmail} already exists!`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}`);
      
      // Check files and orders for this user
      const fileCount = await prisma.tuningFile.count({
        where: { userId: existingUser.id }
      });
      
      const orderCount = await prisma.order.count({
        where: { userId: existingUser.id }
      });
      
      console.log(`   Files: ${fileCount}`);
      console.log(`   Orders: ${orderCount}`);
    } else {
      console.log(`❌ User ${userEmail} does not exist.`);
      console.log('   Please edit this script with your correct email and run it again.');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restoreUserData();
