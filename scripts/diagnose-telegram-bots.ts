import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function checkBotStatus(botToken: string, botName: string) {
  if (!botToken) {
    console.log(`❌ ${botName}: No bot token found`);
    return;
  }

  try {
    // Check bot info
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();
    
    if (botInfo.ok) {
      console.log(`✅ ${botName}: Bot is active`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   Name: ${botInfo.result.first_name}`);
    } else {
      console.log(`❌ ${botName}: Bot token invalid:`, botInfo.description);
      return;
    }

    // Check webhook status
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();
    
    if (webhookInfo.ok) {
      const webhook = webhookInfo.result;
      console.log(`📡 ${botName}: Webhook Status`);
      console.log(`   URL: ${webhook.url || 'Not set'}`);
      console.log(`   Has Custom Certificate: ${webhook.has_custom_certificate}`);
      console.log(`   Pending Updates: ${webhook.pending_update_count}`);
      console.log(`   Last Error Date: ${webhook.last_error_date ? new Date(webhook.last_error_date * 1000).toLocaleString() : 'None'}`);
      console.log(`   Last Error Message: ${webhook.last_error_message || 'None'}`);
      console.log(`   Max Connections: ${webhook.max_connections}`);
      console.log(`   Allowed Updates: ${webhook.allowed_updates?.join(', ') || 'All'}`);
    }

    // Get recent updates
    const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=5`);
    const updatesInfo = await updatesResponse.json();
    
    if (updatesInfo.ok) {
      console.log(`📨 ${botName}: Recent Updates (${updatesInfo.result.length})`);
      if (updatesInfo.result.length > 0) {
        updatesInfo.result.forEach((update: any, index: number) => {
          console.log(`   ${index + 1}. Update ID: ${update.update_id}`);
          if (update.message) {
            console.log(`      Message from: ${update.message.from.first_name} (@${update.message.from.username || 'no_username'})`);
            console.log(`      Text: ${update.message.text || 'No text'}`);
            console.log(`      Date: ${new Date(update.message.date * 1000).toLocaleString()}`);
          }
          if (update.callback_query) {
            console.log(`      Callback from: ${update.callback_query.from.first_name}`);
            console.log(`      Data: ${update.callback_query.data}`);
          }
        });
      } else {
        console.log(`   No recent updates found`);
      }
    }

    console.log(''); // Empty line for separation
  } catch (error) {
    console.log(`❌ ${botName}: Error checking status:`, error);
  }
}

async function testDirectMessage(botToken: string, chatId: string, botName: string) {
  if (!botToken || !chatId) {
    console.log(`❌ ${botName}: Missing token or chat ID for direct message test`);
    return;
  }

  try {
    console.log(`📤 ${botName}: Sending direct test message...`);
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🔍 <b>Direct API Test - ${botName}</b>\n\n✅ This message was sent directly via Telegram API\n🕐 Time: ${new Date().toLocaleString()}\n\nIf you see this, your bot token and chat ID are working correctly!`,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log(`✅ ${botName}: Direct message sent successfully!`);
      console.log(`   Message ID: ${result.result.message_id}`);
    } else {
      console.log(`❌ ${botName}: Failed to send direct message:`, result.description);
    }
  } catch (error) {
    console.log(`❌ ${botName}: Error sending direct message:`, error);
  }
}

async function main() {
  console.log('🔍 Diagnosing Telegram Bot Issues...\n');
  
  const bots = [
    {
      name: 'Super Admin Bot',
      token: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN,
      chatId: process.env.TELEGRAM_SUPER_ADMIN_CHAT_ID,
      enabled: process.env.TELEGRAM_SUPER_ADMIN_ENABLED === 'true'
    },
    {
      name: 'File Admin Bot',
      token: process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN,
      chatId: process.env.TELEGRAM_FILE_ADMIN_CHAT_ID,
      enabled: process.env.TELEGRAM_FILE_ADMIN_ENABLED === 'true'
    },
    {
      name: 'Customer Bot',
      token: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN,
      chatId: undefined, // Customer bot doesn't have a fixed chat ID
      enabled: process.env.TELEGRAM_CUSTOMER_BOT_ENABLED === 'true'
    }
  ];

  for (const bot of bots) {
    if (!bot.enabled) {
      console.log(`⏸️  ${bot.name}: Disabled in configuration\n`);
      continue;
    }
    
    console.log(`🤖 Checking ${bot.name}...`);
    console.log(`   Enabled: ${bot.enabled}`);
    console.log(`   Has Token: ${!!bot.token}`);
    console.log(`   Has Chat ID: ${!!bot.chatId}`);
    console.log('');
    
    await checkBotStatus(bot.token!, bot.name);
    
    if (bot.chatId) {
      await testDirectMessage(bot.token!, bot.chatId, bot.name);
      console.log('');
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🔧 Environment Variables Check:');
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'Not set'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
  console.log('');
  
  console.log('📋 Troubleshooting Tips:');
  console.log('1. If webhook URL is not set, run: npx tsx scripts/setup-webhooks.ts');
  console.log('2. If pending updates > 0, there might be unprocessed messages');
  console.log('3. If last error exists, check your webhook endpoint');
  console.log('4. Make sure your server is accessible from internet');
  console.log('5. Webhook URLs must use HTTPS (use ngrok for development)');
}

main().catch(console.error);
