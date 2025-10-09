import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function setupWebhook(botToken: string, webhookUrl: string, botName: string) {
  if (!botToken || botToken === 'your_token') {
    console.log(`❌ ${botName}: Bot token not configured or placeholder value`);
    return false;
  }

  try {
    console.log(`🔗 Setting webhook for ${botName}...`);
    console.log(`   URL: ${webhookUrl}`);
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log(`✅ ${botName}: Webhook set successfully!`);
      
      // Get webhook info to verify
      const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const infoResult = await infoResponse.json();
      
      if (infoResult.ok) {
        console.log(`   Current URL: ${infoResult.result.url}`);
        console.log(`   Pending Updates: ${infoResult.result.pending_update_count}`);
        if (infoResult.result.last_error_message) {
          console.log(`   Last Error: ${infoResult.result.last_error_message}`);
        }
      }
      
      return true;
    } else {
      console.log(`❌ ${botName}: Failed to set webhook:`, data.description);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${botName}: Error setting webhook:`, error);
    return false;
  }
}

async function main() {
  const productionUrl = 'https://compucar.pro';
  
  console.log('🚀 Setting up Production Telegram Webhooks for compucar.pro...\n');
  
  const bots = [
    {
      name: 'Main Bot (Legacy)',
      token: process.env.TELEGRAM_BOT_TOKEN,
      webhook: `${productionUrl}/api/telegram/webhook`,
      enabled: !!process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_token'
    },
    {
      name: 'Super Admin Bot',
      token: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN,
      webhook: `${productionUrl}/api/telegram/super-admin`,
      enabled: !!process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN && process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN !== 'your_token'
    },
    {
      name: 'File Admin Bot',
      token: process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN,
      webhook: `${productionUrl}/api/telegram/file-admin`,
      enabled: !!process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN && process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN !== 'your_token'
    },
    {
      name: 'Customer Bot',
      token: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN,
      webhook: `${productionUrl}/api/telegram/customer`,
      enabled: !!process.env.TELEGRAM_CUSTOMER_BOT_TOKEN && process.env.TELEGRAM_CUSTOMER_BOT_TOKEN !== 'your_token'
    }
  ];

  let successCount = 0;
  
  for (const bot of bots) {
    if (!bot.enabled) {
      console.log(`⏸️  ${bot.name}: Disabled or not configured`);
      continue;
    }
    
    const success = await setupWebhook(bot.token!, bot.webhook, bot.name);
    if (success) successCount++;
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(''); // Add spacing
  }
  
  console.log(`📊 Summary: ${successCount}/${bots.filter(b => b.enabled).length} webhooks set successfully`);
  
  if (successCount > 0) {
    console.log('\n🎉 Production Telegram webhooks are now configured!');
    console.log('\n📋 Next steps:');
    console.log('1. Test file upload notifications');
    console.log('2. Verify webhook responses in browser developer tools');
    console.log('3. Check Telegram bot logs for any errors');
    
    console.log('\n🔍 To debug webhook issues:');
    console.log('1. Check your server logs at https://compucar.pro');
    console.log('2. Verify SSL certificate is valid');
    console.log('3. Test webhook endpoints directly');
  } else {
    console.log('\n❌ No webhooks were set successfully. Please check:');
    console.log('1. Bot tokens are correctly configured');
    console.log('2. Production server is accessible');
    console.log('3. SSL certificate is valid');
  }
}

main().catch(console.error);

