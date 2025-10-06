#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env files
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function setupTelegramWebhook() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const ngrokUrl = process.argv[2]; // Get ngrok URL from command line argument

    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
      return;
    }

    if (!ngrokUrl) {
      console.error('❌ Please provide your ngrok URL as an argument');
      console.log('Usage: npx tsx scripts/setup-telegram-webhook.ts https://your-ngrok-url.ngrok.io');
      return;
    }

    const webhookUrl = `${ngrokUrl}/api/telegram/webhook`;
    
    console.log('🔗 Setting up Telegram webhook...');
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
      console.log('✅ Webhook set successfully!');
      console.log('📱 Your Telegram bot buttons should now work!');
      
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

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

setupTelegramWebhook();
