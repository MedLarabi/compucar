import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function setupWebhook(botToken: string, webhookUrl: string, botName: string) {
  if (!botToken) {
    console.log(`❌ ${botName}: Bot token not configured`);
    return false;
  }

  try {
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
      console.log(`✅ ${botName}: Webhook set successfully to ${webhookUrl}`);
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('🤖 Setting up Multi-Bot Telegram Webhooks...\n');
  
  const bots = [
    {
      name: 'Super Admin Bot',
      token: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN,
      webhook: `${baseUrl}/api/telegram/super-admin`,
      enabled: process.env.TELEGRAM_SUPER_ADMIN_ENABLED === 'true'
    },
    {
      name: 'File Admin Bot',
      token: process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN,
      webhook: `${baseUrl}/api/telegram/file-admin`,
      enabled: process.env.TELEGRAM_FILE_ADMIN_ENABLED === 'true'
    },
    {
      name: 'Customer Bot',
      token: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN,
      webhook: `${baseUrl}/api/telegram/customer`,
      enabled: process.env.TELEGRAM_CUSTOMER_BOT_ENABLED === 'true'
    }
  ];

  let successCount = 0;
  
  for (const bot of bots) {
    if (!bot.enabled) {
      console.log(`⏸️  ${bot.name}: Disabled in configuration`);
      continue;
    }
    
    const success = await setupWebhook(bot.token!, bot.webhook, bot.name);
    if (success) successCount++;
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Summary: ${successCount}/${bots.filter(b => b.enabled).length} webhooks set successfully`);
  
  if (successCount > 0) {
    console.log('\n🎉 Multi-bot Telegram system is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Test each bot by sending /start command');
    console.log('2. Upload a file to test File Admin bot notifications');
    console.log('3. Check Super Admin bot for system notifications');
    console.log('4. Customers will receive notifications on Customer bot');
  }
}

main().catch(console.error);
