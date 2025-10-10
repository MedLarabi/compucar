#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function setupFileAdminWebhook() {
  const domain = 'https://compucar.pro';
  const botToken = process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN;
  
  console.log('🔧 Setting up File Admin Bot Webhook for compucar.pro\n');
  
  if (!botToken) {
    console.log('❌ TELEGRAM_FILE_ADMIN_BOT_TOKEN not found in environment');
    console.log('   Make sure it\'s set in your .env.local file');
    return;
  }
  
  console.log(`📱 Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`🌐 Domain: ${domain}`);
  console.log(`🔗 Webhook URL: ${domain}/api/telegram/file-admin\n`);
  
  // Set webhook
  try {
    const webhookUrl = `${domain}/api/telegram/file-admin`;
    console.log('⚙️ Setting webhook...');
    
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
      console.log(`✅ Webhook set successfully!`);
      console.log(`📍 URL: ${webhookUrl}`);
    } else {
      console.log('❌ Failed to set webhook:', data.description);
      return;
    }
  } catch (error) {
    console.log('❌ Error setting webhook:', error);
    return;
  }
  
  // Verify webhook
  try {
    console.log('\n🔍 Verifying webhook status...');
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`   URL: ${data.result.url}`);
      console.log(`   Pending Updates: ${data.result.pending_update_count}`);
      console.log(`   Last Error: ${data.result.last_error_message || 'None'}`);
      
      if (data.result.url === `${domain}/api/telegram/file-admin`) {
        console.log('\n🎉 File Admin Bot webhook is now correctly configured!');
        console.log('\n📋 Next steps:');
        console.log('1. Upload a test file to trigger a notification');
        console.log('2. Click the status buttons in the notification');
        console.log('3. Check that file status changes in admin panel');
        console.log('4. Monitor server logs for webhook activity');
      } else {
        console.log('\n⚠️ Webhook URL doesn\'t match expected URL');
      }
    }
  } catch (error) {
    console.log('❌ Error verifying webhook:', error);
  }
}

async function main() {
  try {
    await setupFileAdminWebhook();
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
