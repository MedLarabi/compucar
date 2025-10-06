import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { NotificationService } from '../src/lib/services/notifications';

async function testFileUploadNotification() {
  console.log('🧪 Testing File Upload Notification...\n');
  
  // Simulate a file upload notification
  const success = await NotificationService.notifyAdminNewFileUploadWithDetails(
    'John Doe', // customerName
    'test-ecu-file.bin', // fileName
    'test-file-123', // fileId
    'customer-123', // customerId
    1048576, // fileSize (1MB in bytes)
    ['Stage 1', 'EGR Delete', 'DPF Delete'] // modifications
  );
  
  if (success) {
    console.log('✅ File upload notification sent successfully!');
    console.log('📱 Check your Super Admin Bot on Telegram');
    console.log('\nYou should receive a notification with:');
    console.log('• Customer name: John Doe');
    console.log('• File name: test-ecu-file.bin');
    console.log('• File size: 1.00 MB');
    console.log('• Modifications: Stage 1, EGR Delete, DPF Delete');
    console.log('• Link to admin panel');
  } else {
    console.log('❌ Failed to send file upload notification');
  }
  
  return success;
}

async function main() {
  console.log('🔧 Testing Fixed File Upload Notifications...\n');
  
  const result = await testFileUploadNotification();
  
  if (result) {
    console.log('\n🎉 File upload notifications are now working!');
    console.log('\n📋 Next steps:');
    console.log('1. Try uploading a real file through your website');
    console.log('2. You should receive notifications on your Super Admin Bot');
    console.log('3. The notification will include file details and a link to manage it');
  } else {
    console.log('\n⚠️  There might be an issue with the notification system');
  }
}

main().catch(console.error);
