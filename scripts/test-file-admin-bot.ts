#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { prisma } from '../src/lib/database/prisma';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function testFileAdminBot() {
  const botToken = process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_FILE_ADMIN_CHAT_ID;
  
  console.log('📁 Testing File Admin Bot Status Buttons\n');
  
  console.log('📋 Configuration:');
  console.log(`   Bot Token: ${botToken ? botToken.substring(0, 10) + '...' : 'Not set'}`);
  console.log(`   Chat ID: ${chatId || 'Not set'}`);
  console.log(`   Webhook: https://compucar.pro/api/telegram/file-admin\n`);
  
  if (!botToken || !chatId) {
    console.log('❌ Bot token or chat ID not configured');
    return;
  }
  
  // Find a test file
  console.log('📁 Finding test file...');
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
    
    // Send test message with File Admin Bot status buttons
    console.log('\n📤 Sending File Admin Bot test message...');
    
    const message = `
📁 <b>File Admin Bot - Status Test</b>

📄 <b>File:</b> ${testFile.originalFilename}
👤 <b>Customer:</b> ${testFile.user.firstName} ${testFile.user.lastName}
📊 <b>Current Status:</b> ${testFile.status}
🔧 <b>Modifications:</b> ${testFile.fileModifications.map(fm => fm.modification.label).join(', ')}

🔗 <a href="https://compucar.pro/admin/files/${testFile.id}">View in Admin Panel</a>

<b>🧪 Test the File Admin buttons below:</b>
    `.trim();
    
    // Use File Admin Bot specific callback data format
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
    
    const sendResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup
      })
    });
    
    const sendData = await sendResponse.json();
    
    if (sendData.ok) {
      console.log('✅ File Admin Bot test message sent successfully!');
      console.log('\n🎯 Testing Instructions:');
      console.log('1. Check your File Admin Telegram bot for the test message');
      console.log('2. Click any status button (RECEIVED, PENDING, or READY)');
      console.log('3. Watch your server logs for webhook activity');
      console.log('4. Check admin panel to verify status actually changes');
      console.log('5. Verify customer receives status update notification');
      
      console.log('\n🔍 Expected Server Logs When Button Clicked:');
      console.log('📁 File Admin Bot webhook received: {...}');
      console.log('📱 File Admin bot callback query: file_admin_status_[ID]_[STATUS]');
      console.log('📁 File Admin processing status update: {...}');
      console.log('💾 Updating file status in database...');
      console.log('✅ File status updated successfully: [STATUS]');
      console.log('📝 Audit log created');
      console.log('📢 Sending customer notification...');
      console.log('✅ Customer notification sent');
      console.log('⚡ Sending real-time update...');
      console.log('✅ Real-time update sent');
      
    } else {
      console.log('❌ Failed to send test message:', sendData.description);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error);
  }
}

async function main() {
  try {
    await testFileAdminBot();
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
