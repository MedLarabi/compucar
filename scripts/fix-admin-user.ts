#!/usr/bin/env npx tsx

import { prisma } from '../src/lib/database/prisma';

async function fixAdminUser() {
  try {
    console.log('🔧 Fixing admin user permissions...');

    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@compucar.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`📧 Found admin user: ${adminUser.email}`);
    console.log(`👤 Current role: ${adminUser.role}`);
    console.log(`🔑 Current isAdmin: ${adminUser.isAdmin}`);

    // Update the admin user to have isAdmin: true
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { 
        isAdmin: true,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user updated successfully!');
    console.log(`🔑 New isAdmin: ${updatedUser.isAdmin}`);
    console.log(`👤 New role: ${updatedUser.role}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  }
}

fixAdminUser();
