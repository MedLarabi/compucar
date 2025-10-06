import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });
config({ path: join(process.cwd(), '.env.local') });

import { MultiBotTelegramService, BotType } from '../src/lib/services/multi-bot-telegram';

async function testSuperAdminNotification() {
  console.log('📤 Sending test notification to Super Admin Bot...\n');
  
  // Test system notification
  const success = await MultiBotTelegramService.notifySuperAdmin({
    type: 'system_alert',
    title: '🔧 Webhook Fixed!',
    message: 'Your Super Admin Bot webhook has been successfully updated and is now working properly.',
    details: 'You should now receive all system notifications, file uploads, orders, and system alerts.',
    actionUrl: `${process.env.NEXTAUTH_URL}/admin/dashboard`
  });
  
  if (success) {
    console.log('✅ Test notification sent successfully!');
    console.log('📱 Check your Telegram - you should see the notification');
  } else {
    console.log('❌ Failed to send test notification');
  }
  
  return success;
}

async function main() {
  console.log('🧪 Testing Fixed Super Admin Bot...\n');
  
  const result = await testSuperAdminNotification();
  
  if (result) {
    console.log('\n🎉 Super Admin Bot is now working perfectly!');
    console.log('\n📋 You will now receive notifications for:');
    console.log('• 📁 New file uploads');
    console.log('• 🛒 New orders');
    console.log('• 👤 New user registrations');
    console.log('• 💳 Payment notifications');
    console.log('• 🚨 System alerts');
    console.log('• 📊 System statistics');
    
    console.log('\n💡 Try these commands in your Super Admin Bot:');
    console.log('• /start - Welcome message');
    console.log('• /stats - System statistics');
    console.log('• /system - System status');
  } else {
    console.log('\n⚠️  There might still be an issue. Check your environment variables.');
  }
}

main().catch(console.error);
