import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

async function updateWebhook(botToken: string, webhookUrl: string, botName: string) {
  if (!botToken) {
    console.log(`❌ ${botName}: Bot token not configured`);
    return false;
  }

  try {
    console.log(`🔧 ${botName}: Updating webhook to ${webhookUrl}...`);
    
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
      console.log(`✅ ${botName}: Webhook updated successfully!`);
      return true;
    } else {
      console.log(`❌ ${botName}: Failed to update webhook:`, data.description);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${botName}: Error updating webhook:`, error);
    return false;
  }
}

async function main() {
  // Use ngrok URL since that's what's currently configured
  const baseUrl = 'https://51adef9bdf0b.ngrok-free.app';
  
  console.log('🔧 Fixing Super Admin Bot Webhook...\n');
  
  const superAdminToken = process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN;
  const superAdminWebhook = `${baseUrl}/api/telegram/super-admin`;
  
  if (superAdminToken) {
    const success = await updateWebhook(superAdminToken, superAdminWebhook, 'Super Admin Bot');
    
    if (success) {
      console.log('\n🎉 Super Admin Bot webhook fixed!');
      console.log('✅ Notifications should now work properly');
      console.log('\n📋 Test it by:');
      console.log('1. Uploading a new file (should trigger notification)');
      console.log('2. Checking admin dashboard for system events');
      console.log('3. Sending /start to your Super Admin bot');
    }
  } else {
    console.log('❌ Super Admin Bot token not found in environment variables');
  }
}

main().catch(console.error);
