#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total users: ${users.length}`);
    console.log('\n👥 All users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`);
      console.log(`     Name: ${user.firstName} ${user.lastName}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Check files for each user
    console.log('📁 Files per user:');
    for (const user of users) {
      const fileCount = await prisma.tuningFile.count({
        where: { userId: user.id }
      });
      console.log(`  ${user.email}: ${fileCount} files`);
    }
    
    // Check orders for each user
    console.log('\n🛒 Orders per user:');
    for (const user of users) {
      const orderCount = await prisma.order.count({
        where: { userId: user.id }
      });
      console.log(`  ${user.email}: ${orderCount} orders`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers();