const { config } = require('dotenv');
const { join } = require('path');

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function debugTelegramWebhook() {
  console.log('🔍 Debugging Telegram Webhook Setup...\n');

  // 1. Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ NOT SET'}`);
  console.log(`   TELEGRAM_ENABLED: ${process.env.TELEGRAM_ENABLED || '❌ NOT SET'}`);
  console.log(`   SUPER_ADMIN_TOKEN: ${process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   FILE_ADMIN_TOKEN: ${process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   CUSTOMER_TOKEN: ${process.env.TELEGRAM_CUSTOMER_BOT_TOKEN ? '✅ SET' : '❌ NOT SET'}\n`);

  // 2. Test ngrok URL accessibility
  const ngrokUrl = process.env.NEXTAUTH_URL;
  if (ngrokUrl && ngrokUrl.includes('ngrok')) {
    console.log('🌐 Testing ngrok URL accessibility...');
    try {
      const response = await fetch(ngrokUrl);
      if (response.ok) {
        console.log('✅ ngrok URL is accessible');
      } else {
        console.log(`❌ ngrok URL returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ngrok URL is not accessible: ${error.message}`);
    }
  } else {
    console.log('❌ NEXTAUTH_URL is not set or not an ngrok URL');
  }

  // 3. Test webhook endpoints
  const endpoints = [
    '/api/telegram/super-admin',
    '/api/telegram/file-admin', 
    '/api/telegram/customer'
  ];

  console.log('\n🔗 Testing webhook endpoints...');
  for (const endpoint of endpoints) {
    const fullUrl = `${ngrokUrl}${endpoint}`;
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      console.log(`   ${endpoint}: ${response.ok ? '✅ Accessible' : `❌ Status ${response.status}`}`);
    } catch (error) {
      console.log(`   ${endpoint}: ❌ Error - ${error.message}`);
    }
  }

  // 4. Test bot tokens
  console.log('\n🤖 Testing bot tokens...');
  const bots = [
    { name: 'Super Admin', token: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN },
    { name: 'File Admin', token: process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN },
    { name: 'Customer', token: process.env.TELEGRAM_CUSTOMER_BOT_TOKEN }
  ];

  for (const bot of bots) {
    if (bot.token) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${bot.token}/getMe`);
        const data = await response.json();
        if (data.ok) {
          console.log(`   ${bot.name} Bot: ✅ Valid (${data.result.username})`);
        } else {
          console.log(`   ${bot.name} Bot: ❌ Invalid token`);
        }
      } catch (error) {
        console.log(`   ${bot.name} Bot: ❌ Error - ${error.message}`);
      }
    } else {
      console.log(`   ${bot.name} Bot: ❌ Token not set`);
    }
  }

  // 5. Provide next steps
  console.log('\n📝 Next Steps:');
  console.log('1. Make sure your ngrok is running: ngrok http 3000');
  console.log('2. Update NEXTAUTH_URL in .env.local with your ngrok HTTPS URL');
  console.log('3. Add your Telegram bot tokens to .env.local');
  console.log('4. Run: npx tsx scripts/setup-multi-bot-webhooks.ts');
  console.log('5. Test by sending /start to your bots');
}

debugTelegramWebhook().catch(console.error);
