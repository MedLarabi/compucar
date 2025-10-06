import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/database/prisma';

async function getFileOwnerAndTestUpdates() {
  console.log('🔍 Getting file owner information...\n');
  
  const fileId = '68bc11f0-302d-4eb3-b5b7-896bbd8f9542';
  
  try {
    // Get file details including owner
    const file = await prisma.tuningFile.findUnique({
      where: { id: fileId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!file) {
      console.log('❌ File not found with ID:', fileId);
      return;
    }
    
    console.log('📄 File Details:');
    console.log(`   ID: ${file.id}`);
    console.log(`   Filename: ${file.originalFilename}`);
    console.log(`   Status: ${file.status}`);
    console.log(`   Owner: ${file.user.firstName} ${file.user.lastName} (${file.user.email})`);
    console.log(`   User ID: ${file.user.id}`);
    
    // Import the SSE function
    const { sendUpdateToUser } = await import('../src/lib/sse-utils');
    
    console.log('\n📤 Sending real-time updates to file owner...');
    
    // Test 1: File status update
    console.log('1️⃣ Sending file status update...');
    sendUpdateToUser(file.user.id, {
      type: 'file_status_update',
      fileId: file.id,
      fileName: file.originalFilename,
      oldStatus: file.status,
      newStatus: 'PENDING',
      message: 'File status updated to PENDING'
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Estimated time update
    console.log('2️⃣ Sending estimated time update...');
    sendUpdateToUser(file.user.id, {
      type: 'estimated_time_update',
      fileId: file.id,
      fileName: file.originalFilename,
      estimatedTime: 45,
      timeText: '45 minutes',
      status: 'PENDING',
      message: 'Estimated processing time set to 45 minutes'
    });
    
    console.log('\n✅ Updates sent successfully!');
    
    console.log('\n📋 Now check your file detail page:');
    console.log(`🔗 https://51adef9bdf0b.ngrok-free.app/files/${fileId}`);
    console.log('\n🔍 You should see:');
    console.log('• Real-time status updates without page refresh');
    console.log('• Toast notifications for changes');
    console.log('• Connection status indicator (WiFi icon)');
    console.log('• Console logs in browser developer tools');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🧪 Testing File Detail Page Real-Time Updates...\n');
  
  await getFileOwnerAndTestUpdates();
  
  console.log('\n💡 If updates are not showing:');
  console.log('1. Make sure you are logged in as the file owner');
  console.log('2. Check browser console for SSE connection status');
  console.log('3. Look for the WiFi icon in the top-right corner');
  console.log('4. Try refreshing the page and check again');
}

main().catch(console.error);
