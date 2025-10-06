import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...\n');
    
    const email = 'admin@compucar.com';
    const password = 'admin123';
    const firstName = 'Admin';
    const lastName = 'User';
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log(`   Current role: ${existingUser.role}`);
      console.log(`   isAdmin: ${existingUser.isAdmin}`);
      
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: 'SUPER_ADMIN',
          isAdmin: true,
          password: await bcrypt.hash(password, 12),
        }
      });
      
      console.log(`✅ Updated existing user to SUPER_ADMIN`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Password: ${password}`);
      
    } else {
      // Create new admin user
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
      
      console.log(`✅ Created new admin user:`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   ID: ${adminUser.id}`);
    }
    
    console.log('\n🎉 Admin user ready!');
    console.log('📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Login at: http://localhost:3000/auth/login');
    console.log('🔗 Admin panel: http://localhost:3000/admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
