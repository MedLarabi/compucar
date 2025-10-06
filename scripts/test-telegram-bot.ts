#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env files
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { TelegramService } from '../src/lib/services/telegram';

async function testTelegramBot() {
  try {
    console.log('🤖 Testing Telegram Bot Integration...');

    // Check if Telegram is configured
    const isEnabled = process.env.TELEGRAM_ENABLED === 'true';
    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
    const hasChatId = !!process.env.TELEGRAM_CHAT_ID;

    console.log('📋 Configuration Status:');
    console.log(`   ✅ Enabled: ${isEnabled}`);
    console.log(`   ✅ Bot Token: ${hasToken ? 'Set' : 'Missing'}`);
    console.log(`   ✅ Chat ID: ${hasChatId ? 'Set' : 'Missing'}`);

    if (!isEnabled || !hasToken || !hasChatId) {
      console.log('\n❌ Telegram bot not properly configured.');
      console.log('📝 Please set the following environment variables:');
      console.log('   TELEGRAM_ENABLED=true');
      console.log('   TELEGRAM_BOT_TOKEN=your_bot_token');
      console.log('   TELEGRAM_CHAT_ID=your_chat_id');
      console.log('\n📖 Setup Instructions:');
      console.log('1. Message @BotFather on Telegram');
      console.log('2. Create a new bot with /newbot');
      console.log('3. Get your bot token');
      console.log('4. Message your bot and get your chat ID');
      console.log('5. Add the variables to your .env file');
      return;
    }

    console.log('\n🧪 Testing Telegram notifications...');

    // Test 1: Connection test
    console.log('\n1️⃣ Testing connection...');
    const connectionResult = await TelegramService.testConnection();
    console.log(`   ${connectionResult ? '✅' : '❌'} Connection test: ${connectionResult ? 'Success' : 'Failed'}`);

    // Test 2: New order notification
    console.log('\n2️⃣ Testing new order notification...');
    const orderResult = await TelegramService.notifyNewOrder({
      orderId: 'TEST-001',
      customerName: 'Test Customer',
      totalAmount: 150.00,
      itemsCount: 2
    });
    console.log(`   ${orderResult ? '✅' : '❌'} New order notification: ${orderResult ? 'Sent' : 'Failed'}`);

    // Test 3: File upload notification
    console.log('\n3️⃣ Testing file upload notification...');
    const fileResult = await TelegramService.notifyNewFileUpload({
      fileId: 'test-file-123',
      filename: 'test_ecu_file.bin',
      customerName: 'Test Customer',
      fileSize: 1024000,
      modifications: ['ECU Remapping', 'Performance Tuning']
    });
    console.log(`   ${fileResult ? '✅' : '❌'} File upload notification: ${fileResult ? 'Sent' : 'Failed'}`);

    // Test 4: User registration notification
    console.log('\n4️⃣ Testing user registration notification...');
    const userResult = await TelegramService.notifyNewUserRegistration({
      userId: 'user-123',
      userName: 'New Customer',
      email: 'newcustomer@example.com',
      role: 'CUSTOMER'
    });
    console.log(`   ${userResult ? '✅' : '❌'} User registration notification: ${userResult ? 'Sent' : 'Failed'}`);

    // Test 5: Payment notification
    console.log('\n5️⃣ Testing payment notification...');
    const paymentResult = await TelegramService.notifyPaymentReceived({
      orderId: 'TEST-001',
      customerName: 'Test Customer',
      amount: 150.00,
      paymentMethod: 'Credit Card'
    });
    console.log(`   ${paymentResult ? '✅' : '❌'} Payment notification: ${paymentResult ? 'Sent' : 'Failed'}`);

    // Test 6: File status update notification
    console.log('\n6️⃣ Testing file status update notification...');
    const statusResult = await TelegramService.notifyFileStatusUpdate({
      fileId: 'test-file-123',
      filename: 'test_ecu_file.bin',
      customerName: 'Test Customer',
      oldStatus: 'PENDING',
      newStatus: 'READY',
      estimatedTime: 15
    });
    console.log(`   ${statusResult ? '✅' : '❌'} Status update notification: ${statusResult ? 'Sent' : 'Failed'}`);

    // Test 7: System alert notification
    console.log('\n7️⃣ Testing system alert notification...');
    const alertResult = await TelegramService.notifySystemAlert({
      type: 'info',
      title: 'Test Alert',
      message: 'This is a test system alert',
      details: 'Testing Telegram integration for CompuCar admin notifications'
    });
    console.log(`   ${alertResult ? '✅' : '❌'} System alert notification: ${alertResult ? 'Sent' : 'Failed'}`);

    console.log('\n🎉 Telegram Bot Test Completed!');
    console.log('📱 Check your Telegram chat for the test notifications.');
    console.log('✅ If you received all notifications, your setup is working correctly!');

  } catch (error) {
    console.error('❌ Error testing Telegram bot:', error);
  }
}

testTelegramBot();
