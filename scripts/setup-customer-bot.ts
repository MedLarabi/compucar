#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function setupCustomerBot() {
  const domain = 'https://compucar.pro';
  const botToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
  
  console.log('📱 Setting up Customer Bot for compucar.pro\n');
  
  console.log('📋 Configuration:');
  console.log(`   Bot Token: ${botToken ? botToken.substring(0, 10) + '...' : 'Not set'}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Webhook URL: ${domain}/api/telegram/customer\n`);
  
  if (!botToken) {
    console.log('❌ TELEGRAM_CUSTOMER_BOT_TOKEN not found in environment');
    console.log('   Add TELEGRAM_CUSTOMER_BOT_TOKEN=your-bot-token to your .env');
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
    const webhookUrl = `${domain}/api/telegram/customer`;
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
  
  console.log('\n🎉 Customer Bot setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the bot by sending /start to it');
  console.log('2. Try linking a test account with /link test@example.com');
  console.log('3. Upload a file and test status change notifications');
  console.log('4. Monitor server logs for webhook activity');
  
  console.log('\n💡 How customers will use it:');
  console.log('1. Customer starts chat with your bot');
  console.log('2. Customer sends: /link their-email@example.com');
  console.log('3. Bot links their Telegram to their CompuCar account');
  console.log('4. Customer receives instant notifications for file status changes!');
}

async function main() {
  try {
    await setupCustomerBot();
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
