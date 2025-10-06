#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env files
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { TelegramService } from '../src/lib/services/telegram';

async function testTelegramFileManagement() {
  try {
    console.log('📱 Testing Telegram File Management System...\n');

    // Test 1: File upload notification with inline buttons
    console.log('1️⃣ Testing file upload notification with inline buttons...');
    const fileUploadResult = await TelegramService.notifyNewFileUpload({
      fileId: 'test-file-management-123',
      filename: 'customer_ecu_tuning.bin',
      customerName: 'John Doe',
      fileSize: 2048000,
      modifications: ['ECU Remapping', 'Performance Tuning', 'Custom Map']
    });
    console.log(`   ${fileUploadResult ? '✅' : '❌'} File upload notification: ${fileUploadResult ? 'Sent' : 'Failed'}`);

    if (fileUploadResult) {
      console.log('\n📱 Check your Telegram! You should see:');
      console.log('   📁 New file upload notification');
      console.log('   ✅ "Set to READY" button');
      console.log('   ⏳ "Set to PENDING" button');
      console.log('   ⏰ "Set Estimated Time" button');
      console.log('\n💡 Try clicking the buttons to test the functionality!');
    }

    // Test 2: Estimated time request
    console.log('\n2️⃣ Testing estimated time request...');
    const timeRequestResult = await TelegramService.requestEstimatedTime(
      process.env.TELEGRAM_CHAT_ID || '',
      'test-file-management-456',
      'test_ecu_file.bin'
    );
    console.log(`   ${timeRequestResult ? '✅' : '❌'} Estimated time request: ${timeRequestResult ? 'Sent' : 'Failed'}`);

    if (timeRequestResult) {
      console.log('\n📱 Check your Telegram! You should see:');
      console.log('   ⏰ Estimated time selection menu');
      console.log('   ⏱️  Time options: 15min, 30min, 1h, 2h, 4h, 1 day');
      console.log('   📝 Custom time option');
      console.log('   ❌ Cancel option');
    }

    console.log('\n🎉 Telegram File Management Test Completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up webhook URL in your Telegram bot settings');
    console.log('2. Test the inline buttons by clicking them');
    console.log('3. Verify that file statuses are updated in your database');
    console.log('4. Check that customers receive notifications');

  } catch (error) {
    console.error('❌ Error testing Telegram file management:', error);
  }
}

testTelegramFileManagement();
