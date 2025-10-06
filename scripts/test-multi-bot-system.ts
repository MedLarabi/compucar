import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { MultiBotTelegramService, BotType } from '../src/lib/services/multi-bot-telegram';

async function testBot(botType: BotType, botName: string) {
  console.log(`\n🤖 Testing ${botName}...`);
  
  const testMessage = `
🧪 <b>${botName} Test</b>

✅ Connection successful!
🕐 <b>Time:</b> ${new Date().toLocaleString()}
🌐 <b>Environment:</b> ${process.env.NODE_ENV || 'development'}

Your ${botName.toLowerCase()} is now active! 🚀
  `.trim();

  const success = await MultiBotTelegramService.sendMessage(botType, testMessage);
  
  if (success) {
    console.log(`✅ ${botName}: Test message sent successfully`);
  } else {
    console.log(`❌ ${botName}: Failed to send test message`);
  }
  
  return success;
}

async function testFileAdminFeatures() {
  console.log('\n📁 Testing File Admin Bot Features...');
  
  // Test file upload notification with buttons
  const success = await MultiBotTelegramService.notifyFileAdminNewUpload({
    fileId: 'test-file-123',
    filename: 'test-ecu-file.bin',
    customerName: 'John Doe',
    fileSize: 1024000, // 1MB
    modifications: ['Stage 1', 'EGR Delete', 'DPF Delete']
  });
  
  if (success) {
    console.log('✅ File Admin: File upload notification with buttons sent successfully');
  } else {
    console.log('❌ File Admin: Failed to send file upload notification');
  }
  
  return success;
}

async function testSuperAdminFeatures() {
  console.log('\n🔧 Testing Super Admin Bot Features...');
  
  // Test system notification
  const success = await MultiBotTelegramService.notifySuperAdmin({
    type: 'system_alert',
    title: 'System Test Alert',
    message: 'This is a test system alert to verify Super Admin bot functionality.',
    details: 'All systems are functioning normally. This is just a test.',
    actionUrl: `${process.env.NEXTAUTH_URL}/admin/dashboard`
  });
  
  if (success) {
    console.log('✅ Super Admin: System alert notification sent successfully');
  } else {
    console.log('❌ Super Admin: Failed to send system alert notification');
  }
  
  return success;
}

async function testCustomerFeatures() {
  console.log('\n📱 Testing Customer Bot Features...');
  
  // Note: Customer bot requires a chat ID, which would normally come from user interaction
  // This test will only verify the bot configuration, not send an actual message
  console.log('ℹ️  Customer Bot: Configuration test only (requires user chat ID for actual messages)');
  
  // Test configuration
  const config = {
    botToken: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN || '',
    enabled: process.env.TELEGRAM_CUSTOMER_BOT_ENABLED === 'true'
  };
  
  if (config.enabled && config.botToken) {
    console.log('✅ Customer Bot: Configuration is valid');
    return true;
  } else {
    console.log('❌ Customer Bot: Configuration is invalid or disabled');
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Multi-Bot Telegram System...\n');
  
  const results = {
    superAdmin: false,
    fileAdmin: false,
    customer: false
  };
  
  // Test each bot
  results.superAdmin = await testBot(BotType.SUPER_ADMIN, 'Super Admin Bot');
  results.fileAdmin = await testBot(BotType.FILE_ADMIN, 'File Admin Bot');
  results.customer = await testCustomerFeatures();
  
  // Test advanced features
  if (results.fileAdmin) {
    await testFileAdminFeatures();
  }
  
  if (results.superAdmin) {
    await testSuperAdminFeatures();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`🔧 Super Admin Bot: ${results.superAdmin ? '✅ Working' : '❌ Failed'}`);
  console.log(`📁 File Admin Bot: ${results.fileAdmin ? '✅ Working' : '❌ Failed'}`);
  console.log(`📱 Customer Bot: ${results.customer ? '✅ Configured' : '❌ Not Configured'}`);
  
  const workingBots = Object.values(results).filter(r => r).length;
  console.log(`\n🎯 Overall: ${workingBots}/3 bots are functional`);
  
  if (workingBots === 3) {
    console.log('\n🎉 All bots are working perfectly!');
    console.log('\n📋 What each bot does:');
    console.log('🔧 Super Admin Bot: Full system control, comprehensive notifications');
    console.log('📁 File Admin Bot: File tuning system management with interactive buttons');
    console.log('📱 Customer Bot: Customer notifications and support');
  } else {
    console.log('\n⚠️  Some bots need configuration. Check your environment variables:');
    if (!results.superAdmin) console.log('- TELEGRAM_SUPER_ADMIN_BOT_TOKEN, TELEGRAM_SUPER_ADMIN_CHAT_ID, TELEGRAM_SUPER_ADMIN_ENABLED');
    if (!results.fileAdmin) console.log('- TELEGRAM_FILE_ADMIN_BOT_TOKEN, TELEGRAM_FILE_ADMIN_CHAT_ID, TELEGRAM_FILE_ADMIN_ENABLED');
    if (!results.customer) console.log('- TELEGRAM_CUSTOMER_BOT_TOKEN, TELEGRAM_CUSTOMER_BOT_ENABLED');
  }
}

main().catch(console.error);
