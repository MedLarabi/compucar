import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeTestingUserAdmin() {
  try {
    console.log('🔧 Making testing@gmail.com an admin...\n');
    
    const updatedUser = await prisma.user.update({
      where: { email: 'testing@gmail.com' },
      data: { isAdmin: true }
    });

    console.log('✅ User updated successfully:');
    console.log(`   📧 Email: ${updatedUser.email}`);
    console.log(`   👤 Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   🔑 Admin: ${updatedUser.isAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   📋 Role: ${updatedUser.role}`);
    
    console.log('\n🎉 You can now access the admin panel!');
    console.log('   📁 Admin Files: http://localhost:3003/admin/files');
    console.log('   🏠 Admin Dashboard: http://localhost:3003/admin');

  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeTestingUserAdmin();









