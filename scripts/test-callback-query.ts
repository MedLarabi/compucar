import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function testCallbackQuery() {
  const productionUrl = 'https://compucar.pro';
  
  console.log('🧪 Testing Telegram Callback Query Processing...\n');
  
  // Test callback query data that was failing
  const testCallbackData = 'file_admin_status_7bf61c9e-ab61-4709-908a-baeb7a8f6ec1_READY';
  
  console.log('📋 Test callback data:', testCallbackData);
  
  // Parse the callback data
  const parts = testCallbackData.split('_');
  console.log('📋 Parsed parts:', parts);
  
  if (parts[0] === 'file' && parts[1] === 'admin' && parts[2] === 'status') {
    const fileId = parts[3];
    const newStatus = parts[4];
    
    console.log('✅ Callback format recognized:');
    console.log(`   File ID: ${fileId}`);
    console.log(`   New Status: ${newStatus}`);
    
    // Test if this would work with the Super Admin webhook
    console.log('\n🔍 Testing Super Admin webhook endpoint...');
    
    const testPayload = {
      callback_query: {
        id: 'test_callback_id',
        data: testCallbackData,
        message: {
          chat: {
            id: 123456789
          },
          message_id: 123
        }
      }
    };
    
    try {
      const response = await fetch(`${productionUrl}/api/telegram/super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   Response Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.text();
        console.log('✅ Super Admin webhook can handle this callback format');
        console.log(`   Response: ${result}`);
      } else {
        console.log('❌ Super Admin webhook returned error');
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log('❌ Error testing Super Admin webhook:', error instanceof Error ? error.message : String(error));
    }
    
  } else {
    console.log('❌ Callback format not recognized');
  }
  
  console.log('\n📊 Current Webhook Configuration:');
  console.log('   Main Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not configured');
  console.log('   Super Admin Token:', process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN ? 'Configured' : 'Not configured');
  console.log('   File Admin Token:', process.env.TELEGRAM_FILE_ADMIN_BOT_TOKEN === 'your_token' ? 'Not configured' : 'Configured');
  console.log('   Customer Token:', process.env.TELEGRAM_CUSTOMER_BOT_TOKEN === 'your_token' ? 'Not configured' : 'Configured');
  
  if (process.env.TELEGRAM_BOT_TOKEN === process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN) {
    console.log('\n⚠️  WARNING: Main bot and Super Admin bot are using the same token!');
    console.log('   This can cause callback routing issues.');
    console.log('   Consider using separate bot tokens for different functions.');
  }
  
  console.log('\n🎯 Recommendation:');
  console.log('1. The callback format suggests this should go to File Admin bot');
  console.log('2. But File Admin bot token is not configured (shows "your_token")');
  console.log('3. Both Main and Super Admin bots use the same token');
  console.log('4. Added support for file_admin_status format to Super Admin bot');
  console.log('5. This should now work with your current configuration');
}

testCallbackQuery().catch(console.error);
