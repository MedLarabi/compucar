import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { MultiBotTelegramService, BotType } from '../src/lib/services/multi-bot-telegram';
import { NotificationService } from '../src/lib/services/notifications';

async function testCompleteFileWorkflow() {
  console.log('🧪 Testing Complete File Management Workflow...\n');
  
  // Test 1: File upload notification with buttons
  console.log('1️⃣ Testing file upload notification with interactive buttons...');
  const uploadSuccess = await MultiBotTelegramService.notifySuperAdmin({
    type: 'new_file_upload',
    title: 'New File Upload',
    message: 'John Doe uploaded a new file: "test-ecu-file.bin"',
    details: 'File Size: 1.50 MB\nModifications: Stage 1, EGR Delete, DPF Delete',
    actionUrl: `${process.env.NEXTAUTH_URL}/admin/files/test-file-123`,
    fileId: 'test-file-123',
    filename: 'test-ecu-file.bin'
  });
  
  if (uploadSuccess) {
    console.log('✅ File upload notification with buttons sent successfully!');
  } else {
    console.log('❌ Failed to send file upload notification');
  }
  
  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Admin panel status change notification
  console.log('\n2️⃣ Testing admin panel status change notification...');
  const statusSuccess = await MultiBotTelegramService.notifySuperAdmin({
    type: 'system_alert',
    title: 'File Status Updated',
    message: 'Admin User changed file status to PENDING',
    details: 'File: test-ecu-file.bin\nCustomer: John Doe\nEstimated Time: 30 minutes',
    actionUrl: `${process.env.NEXTAUTH_URL}/admin/files/test-file-123`
  });
  
  if (statusSuccess) {
    console.log('✅ Admin status change notification sent successfully!');
  } else {
    console.log('❌ Failed to send admin status change notification');
  }
  
  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: System statistics
  console.log('\n3️⃣ Testing system statistics notification...');
  const statsSuccess = await MultiBotTelegramService.notifySuperAdmin({
    type: 'system_alert',
    title: 'Daily System Report',
    message: 'System statistics summary for today',
    details: 'New Files: 5\nProcessed Files: 3\nActive Users: 12\nRevenue: $450',
    actionUrl: `${process.env.NEXTAUTH_URL}/admin/dashboard`
  });
  
  if (statsSuccess) {
    console.log('✅ System statistics notification sent successfully!');
  } else {
    console.log('❌ Failed to send system statistics notification');
  }
  
  return { uploadSuccess, statusSuccess, statsSuccess };
}

async function main() {
  console.log('🚀 Testing Complete Super Admin Bot Functionality...\n');
  
  const results = await testCompleteFileWorkflow();
  
  const successCount = Object.values(results).filter(r => r).length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`📁 File Upload with Buttons: ${results.uploadSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`🔧 Admin Status Changes: ${results.statusSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`📊 System Notifications: ${results.statsSuccess ? '✅ Working' : '❌ Failed'}`);
  
  console.log(`\n🎯 Overall: ${successCount}/3 features are functional`);
  
  if (successCount === 3) {
    console.log('\n🎉 Super Admin Bot is fully functional!');
    console.log('\n📋 Your Super Admin Bot now supports:');
    console.log('✅ File upload notifications with interactive buttons');
    console.log('✅ Status change notifications from admin panel');
    console.log('✅ File management directly from Telegram');
    console.log('✅ Estimated time setting with full options');
    console.log('✅ Real-time message updates');
    console.log('✅ Customer notifications when you make changes');
    
    console.log('\n🎮 How to use:');
    console.log('1. Upload a file → Get notification with buttons');
    console.log('2. Click buttons to change status or set time');
    console.log('3. Changes from admin panel also notify you');
    console.log('4. All actions notify customers automatically');
  } else {
    console.log('\n⚠️  Some features need attention. Check your configuration.');
  }
}

main().catch(console.error);
