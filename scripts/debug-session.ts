import { auth } from '@/lib/auth/config';

async function debugSession() {
  try {
    console.log('🔍 Debugging session data...\n');
    
    const session = await auth();
    
    if (!session) {
      console.log('❌ No session found');
      return;
    }
    
    console.log('✅ Session found:');
    console.log('   User ID:', session.user?.id);
    console.log('   Email:', session.user?.email);
    console.log('   Name:', session.user?.name);
    console.log('   Role:', session.user?.role);
    console.log('   isAdmin:', session.user?.isAdmin);
    console.log('   First Name:', session.user?.firstName);
    console.log('   Last Name:', session.user?.lastName);
    
    // Check admin access logic
    const userRole = session.user?.role;
    const isAdminFlag = session.user?.isAdmin;
    const hasAdminAccess = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || isAdminFlag === true;
    
    console.log('\n🔐 Admin Access Check:');
    console.log('   userRole === "ADMIN":', userRole === "ADMIN");
    console.log('   userRole === "SUPER_ADMIN":', userRole === "SUPER_ADMIN");
    console.log('   isAdminFlag === true:', isAdminFlag === true);
    console.log('   hasAdminAccess:', hasAdminAccess);
    
  } catch (error) {
    console.error('❌ Error debugging session:', error);
  }
}

debugSession();
