import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toISOString() : 'Never'}`);
      console.log('   ---');
    });

    // Check for admin users
    const adminUsers = users.filter((user: any) => 
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.isAdmin
    );

    console.log(`\n👑 Admin users: ${adminUsers.length}`);
    adminUsers.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    if (adminUsers.length === 0) {
      console.log('\n❌ No admin users found!');
      console.log('💡 You need to create an admin user.');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
