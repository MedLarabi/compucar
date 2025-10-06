import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { NotificationService } from '../src/lib/services/notifications';

async function testRealFileUploadFlow() {
  console.log('🔍 Testing Real File Upload Notification Flow...\n');
  
  // Simulate the exact same call that happens when a file is uploaded
  console.log('📤 Simulating file upload notification...');
  
  try {
    const success = await NotificationService.notifyAdminNewFileUploadWithDetails(
      'Test Customer', // customerName
      'real-test-file.bin', // fileName
      'real-file-id-123', // fileId
      'customer-456', // customerId
      2097152, // fileSize (2MB in bytes)
      ['Stage 1', 'EGR Delete'] // modifications
    );
    
    if (success) {
      console.log('✅ File upload notification sent successfully!');
      console.log('📱 Check your Super Admin Bot - you should see:');
      console.log('   • Customer: Test Customer');
      console.log('   • File: real-test-file.bin');
      console.log('   • Size: 2.00 MB');
      console.log('   • Modifications: Stage 1, EGR Delete');
      console.log('   • Interactive buttons for status management');
    } else {
      console.log('❌ Failed to send file upload notification');
    }
    
    return success;
  } catch (error) {
    console.error('💥 Error in file upload notification:', error);
    return false;
  }
}

async function checkWebhookStatus() {
  console.log('\n🔍 Checking Super Admin Bot webhook status...');
  
  const botToken = process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN;
  
  if (!botToken) {
    console.log('❌ Super Admin Bot token not found');
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      const webhook = data.result;
      console.log('📡 Webhook Information:');
      console.log(`   URL: ${webhook.url || 'Not set'}`);
      console.log(`   Pending Updates: ${webhook.pending_update_count}`);
      console.log(`   Last Error: ${webhook.last_error_message || 'None'}`);
      console.log(`   Last Error Date: ${webhook.last_error_date ? new Date(webhook.last_error_date * 1000).toLocaleString() : 'None'}`);
      
      if (!webhook.url) {
        console.log('⚠️  Webhook URL is not set!');
        return false;
      }
      
      if (webhook.pending_update_count > 0) {
        console.log(`⚠️  There are ${webhook.pending_update_count} pending updates`);
      }
      
      if (webhook.last_error_message) {
        console.log(`⚠️  Last webhook error: ${webhook.last_error_message}`);
        return false;
      }
      
      return true;
    } else {
      console.log('❌ Failed to get webhook info:', data.description);
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking webhook:', error);
    return false;
  }
}

async function testDirectBotMessage() {
  console.log('\n📤 Testing direct Super Admin Bot message...');
  
  const { MultiBotTelegramService, BotType } = await import('../src/lib/services/multi-bot-telegram');
  
  const success = await MultiBotTelegramService.sendMessage(
    BotType.SUPER_ADMIN,
    `
🔧 <b>Direct Test Message</b>

This is a direct test to verify your Super Admin Bot is working.

🕐 <b>Time:</b> ${new Date().toLocaleString()}
📡 <b>Status:</b> Testing connectivity

If you see this message, the bot token and chat ID are working correctly.
    `.trim()
  );
  
  if (success) {
    console.log('✅ Direct bot message sent successfully!');
  } else {
    console.log('❌ Failed to send direct bot message');
  }
  
  return success;
}

async function main() {
  console.log('🚀 Diagnosing File Upload Notification Issues...\n');
  
  // Test 1: Check webhook status
  const webhookOk = await checkWebhookStatus();
  
  // Test 2: Test direct bot messaging
  const directOk = await testDirectBotMessage();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Test the actual file upload flow
  const uploadFlowOk = await testRealFileUploadFlow();
  
  console.log('\n📊 Diagnosis Results:');
  console.log(`📡 Webhook Status: ${webhookOk ? '✅ OK' : '❌ Issues'}`);
  console.log(`🤖 Direct Bot Messaging: ${directOk ? '✅ OK' : '❌ Issues'}`);
  console.log(`📁 File Upload Flow: ${uploadFlowOk ? '✅ OK' : '❌ Issues'}`);
  
  if (webhookOk && directOk && uploadFlowOk) {
    console.log('\n🎉 Everything looks good! File upload notifications should work.');
    console.log('📋 Try uploading a real file now to test the full flow.');
  } else {
    console.log('\n⚠️  Issues found:');
    if (!webhookOk) {
      console.log('- Webhook configuration problems');
      console.log('  Solution: Check if your ngrok URL is still active and webhook is set correctly');
    }
    if (!directOk) {
      console.log('- Bot token or chat ID issues');
      console.log('  Solution: Verify TELEGRAM_SUPER_ADMIN_BOT_TOKEN and TELEGRAM_SUPER_ADMIN_CHAT_ID');
    }
    if (!uploadFlowOk) {
      console.log('- File upload notification flow problems');
      console.log('  Solution: Check the notification service integration');
    }
  }
}

main().catch(console.error);
