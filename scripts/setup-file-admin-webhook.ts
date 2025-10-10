#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function setupFileAdminWebhook() {
  const botToken = process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_FILE_ADMIN_BOT_TOKEN not found in environment variables');
    return;
  }

  const webhookUrl = `https://compucar.pro/api/telegram/file-admin`;
  
  console.log('🔗 Setting up File Admin Bot webhook...');
  console.log(`📱 Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`🌐 Webhook URL: ${webhookUrl}`);

  // Set the webhook
  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    })
  });

  const result = await response.json();

  if (result.ok) {
    console.log('✅ File Admin Bot webhook set successfully!');
    console.log('📱 Your File Admin Bot buttons should now work!');
    
    // Get webhook info to confirm
    const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.ok) {
      console.log('\n📋 Webhook Info:');
      console.log(`   URL: ${infoResult.result.url}`);
      console.log(`   Pending Updates: ${infoResult.result.pending_update_count}`);
      console.log(`   Last Error: ${infoResult.result.last_error_message || 'None'}`);
    }
  } else {
    console.error('❌ Failed to set webhook:', result);
  }
}

setupFileAdminWebhook().catch(console.error);
