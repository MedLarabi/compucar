#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '../src/lib/database/prisma';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  enabled: boolean;
}

function getTelegramConfig(): TelegramConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    enabled: process.env.TELEGRAM_ENABLED === 'true'
  };
}

async function testTelegramBot() {
  const config = getTelegramConfig();
  
  console.log('🤖 Telegram Bot Status Test\n');
  
  // Check configuration
  console.log('📋 Configuration:');
  console.log(`   Enabled: ${config.enabled}`);
  console.log(`   Bot Token: ${config.botToken ? config.botToken.substring(0, 10) + '...' : 'Not set'}`);
  console.log(`   Chat ID: ${config.chatId || 'Not set'}\n`);
  
  if (!config.enabled) {
    console.log('❌ Telegram is disabled in configuration');
    return;
  }
  
  if (!config.botToken) {
    console.log('❌ TELEGRAM_BOT_TOKEN not configured');
    return;
  }
  
  if (!config.chatId) {
    console.log('❌ TELEGRAM_CHAT_ID not configured');
    return;
  }
  
  // Test bot connection
  console.log('🔗 Testing bot connection...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
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
  
  // Check webhook status
  console.log('\n🌐 Checking webhook status...');
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   URL: ${data.result.url || 'Not set'}`);
      console.log(`   Pending Updates: ${data.result.pending_update_count}`);
      console.log(`   Last Error: ${data.result.last_error_message || 'None'}`);
      
      if (!data.result.url) {
        console.log('⚠️  No webhook URL set - buttons won\'t work!');
        console.log('   Run: npx tsx scripts/setup-telegram-webhook.ts <your-ngrok-url>');
      }
    }
  } catch (error) {
    console.log('❌ Webhook check error:', error);
  }
  
  // Find a test file to use
  console.log('\n📁 Finding test file...');
  try {
    const testFile = await prisma.tuningFile.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        fileModifications: {
          include: { modification: true }
        }
      }
    });
    
    if (!testFile) {
      console.log('❌ No files found in database for testing');
      return;
    }
    
    console.log(`✅ Found test file: ${testFile.originalFilename}`);
    console.log(`   Status: ${testFile.status}`);
    console.log(`   Customer: ${testFile.user.firstName} ${testFile.user.lastName}`);
    
    // Send test message with status buttons
    console.log('\n📤 Sending test message with status buttons...');
    
    const message = `
🧪 <b>Telegram Bot Status Test</b>

📄 <b>File:</b> ${testFile.originalFilename}
👤 <b>Customer:</b> ${testFile.user.firstName} ${testFile.user.lastName}
📊 <b>Current Status:</b> ${testFile.status}
🔧 <b>Modifications:</b> ${testFile.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="${process.env.NEXTAUTH_URL}/admin/files/${testFile.id}">View in Admin Panel</a>

<b>Test the buttons below:</b>
    `.trim();
    
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: testFile.status === 'RECEIVED' ? '📥 RECEIVED ✓' : '📥 Set to RECEIVED',
            callback_data: `file_admin_status_${testFile.id}_RECEIVED`
          }
        ],
        [
          {
            text: testFile.status === 'PENDING' ? '⏳ PENDING ✓' : '⏳ Set to PENDING',
            callback_data: `file_admin_status_${testFile.id}_PENDING`
          }
        ],
        [
          {
            text: testFile.status === 'READY' ? '✅ READY ✓' : '✅ Set to READY',
            callback_data: `file_admin_status_${testFile.id}_READY`
          }
        ]
      ]
    };
    
    const sendResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup
      })
    });
    
    const sendData = await sendResponse.json();
    
    if (sendData.ok) {
      console.log('✅ Test message sent successfully!');
      console.log('📱 Check your Telegram and try clicking the status buttons');
      console.log('🔍 Watch the server logs for debugging information');
    } else {
      console.log('❌ Failed to send test message:', sendData.description);
    }
    
  } catch (error) {
    console.log('❌ Test file error:', error);
  }
}

async function main() {
  try {
    await testTelegramBot();
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
