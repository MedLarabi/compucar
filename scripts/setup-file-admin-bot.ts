#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function setupFileAdminBot() {
  const baseUrl = 'https://compucar.pro'; // Your production domain
  const botToken = process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_FILE_ADMIN_CHAT_ID;
  const enabled = process.env.TELEGRAM_FILE_ADMIN_ENABLED === 'true';
  
  console.log('📁 Setting up File Admin Bot...\n');
  
  console.log('📋 Configuration:');
  console.log(`   Enabled: ${enabled}`);
  console.log(`   Bot Token: ${botToken ? botToken.substring(0, 10) + '...' : 'Not set'}`);
  console.log(`   Chat ID: ${chatId || 'Not set'}`);
  console.log(`   Webhook URL: ${baseUrl}/api/telegram/file-admin\n`);
  
  if (!enabled) {
    console.log('❌ File Admin Bot is disabled in configuration');
    console.log('   Set TELEGRAM_FILE_ADMIN_ENABLED=true in your .env.local');
    return;
  }
  
  if (!botToken) {
    console.log('❌ TELEGRAM_FILE_ADMIN_BOT_TOKEN not configured');
    console.log('   Add TELEGRAM_FILE_ADMIN_BOT_TOKEN=your-bot-token to your .env.local');
    return;
  }
  
  if (!chatId) {
    console.log('❌ TELEGRAM_FILE_ADMIN_CHAT_ID not configured');
    console.log('   Add TELEGRAM_FILE_ADMIN_CHAT_ID=your-chat-id to your .env.local');
    return;
  }
  
  // Test bot connection
  console.log('🔗 Testing bot connection...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Bot connected: @${data.result.username} (${data.result.first_name})`);
    } else {
      console.log('❌ Bot connection failed:', data.description);
      return;
    }
  } catch (error) {
    console.log('❌ Bot connection error:', error);
    return;
  }
  
  // Set webhook
  console.log('\n🌐 Setting webhook...');
  try {
    const webhookUrl = `${baseUrl}/api/telegram/file-admin`;
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ Webhook set successfully to ${webhookUrl}`);
    } else {
      console.log('❌ Failed to set webhook:', data.description);
      return;
    }
  } catch (error) {
    console.log('❌ Webhook setup error:', error);
    return;
  }
  
  // Check webhook status
  console.log('\n📋 Verifying webhook...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   URL: ${data.result.url}`);
      console.log(`   Pending Updates: ${data.result.pending_update_count}`);
      console.log(`   Last Error: ${data.result.last_error_message || 'None'}`);
    }
  } catch (error) {
    console.log('❌ Webhook verification error:', error);
  }
  
  // Send test message
  console.log('\n📤 Sending test message...');
  try {
    const message = `
🎉 <b>File Admin Bot Setup Complete!</b>

✅ <b>Bot Status:</b> Active and Ready
🌐 <b>Webhook:</b> Connected to compucar.pro
📁 <b>Purpose:</b> File tuning system management

<b>🔧 What this bot will do:</b>
• Receive notifications when customers upload files
• Allow you to change file status with buttons
• Set estimated processing times
• Track file modifications and progress

<b>📋 Available Actions:</b>
• ✅ Set to READY - Mark file as completed
• ⏳ Set to PENDING - Mark file as in progress  
• 📥 Set to RECEIVED - Mark file as received
• ⏰ Set Estimated Time - Choose processing time

<b>🧪 Test Instructions:</b>
1. Have a customer upload a file at compucar.pro
2. You'll receive a notification here with action buttons
3. Click the buttons to change file status
4. Customer will be notified automatically

<b>Ready to process files! 🚀</b>
    `.trim();
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    
    const sendData = await response.json();
    
    if (sendData.ok) {
      console.log('✅ Test message sent successfully!');
      console.log('\n🎉 File Admin Bot is now ready!');
      console.log('\n📋 Next steps:');
      console.log('1. Have a customer upload a file to test notifications');
      console.log('2. Use the status buttons to change file status');
      console.log('3. Monitor the admin panel to see status changes');
      console.log('4. Check customer receives status update notifications');
    } else {
      console.log('❌ Failed to send test message:', sendData.description);
    }
    
  } catch (error) {
    console.log('❌ Test message error:', error);
  }
}

async function main() {
  try {
    await setupFileAdminBot();
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
