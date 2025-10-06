import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    // Replace with your email address
    const userEmail = 'your-email@example.com'; // CHANGE THIS TO YOUR EMAIL
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      console.log('Available users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, isAdmin: true }
      });
      console.table(allUsers);
      return;
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { isAdmin: true }
    });

    console.log('✅ User updated successfully:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      isAdmin: updatedUser.isAdmin
    });

    console.log('\n🎉 You can now access the admin panel at: http://localhost:3003/admin/files');

  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserAdmin();
