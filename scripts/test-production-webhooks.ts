import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function testWebhookEndpoint(url: string, endpointName: string) {
  try {
    console.log(`🔍 Testing ${endpointName}...`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Telegram-Webhook-Test/1.0'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`✅ ${endpointName}: Endpoint is accessible`);
      return true;
    } else {
      console.log(`⚠️  ${endpointName}: Endpoint returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpointName}: Error accessing endpoint:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function getWebhookInfo(botToken: string, botName: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await response.json();
    
    if (data.ok) {
      console.log(`\n📋 ${botName} Webhook Info:`);
      console.log(`   URL: ${data.result.url}`);
      console.log(`   Has Custom Certificate: ${data.result.has_custom_certificate}`);
      console.log(`   Pending Update Count: ${data.result.pending_update_count}`);
      console.log(`   Max Connections: ${data.result.max_connections || 'Default (40)'}`);
      console.log(`   Allowed Updates: ${data.result.allowed_updates?.join(', ') || 'All'}`);
      
      if (data.result.last_error_date) {
        const errorDate = new Date(data.result.last_error_date * 1000);
        console.log(`   Last Error Date: ${errorDate.toISOString()}`);
        console.log(`   Last Error Message: ${data.result.last_error_message}`);
      } else {
        console.log(`   Last Error: None`);
      }
      
      if (data.result.last_synchronization_error_date) {
        const syncErrorDate = new Date(data.result.last_synchronization_error_date * 1000);
        console.log(`   Last Sync Error: ${syncErrorDate.toISOString()}`);
      }
      
      return data.result;
    } else {
      console.log(`❌ Failed to get webhook info for ${botName}:`, data.description);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error getting webhook info for ${botName}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testSSLCertificate(domain: string) {
  try {
    console.log(`\n🔒 Testing SSL Certificate for ${domain}...`);
    
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD'
    });
    
    console.log(`   SSL Status: ${response.status} ${response.statusText}`);
    
    // Check if the connection is secure
    if (response.url.startsWith('https://')) {
      console.log(`✅ SSL Certificate: Valid and accessible`);
      return true;
    } else {
      console.log(`❌ SSL Certificate: Connection not secure`);
      return false;
    }
  } catch (error) {
    console.log(`❌ SSL Certificate: Error testing SSL:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  const productionUrl = 'https://compucar.pro';
  const domain = 'compucar.pro';
  
  console.log('🧪 Testing Production Telegram Webhook Configuration...\n');
  
  // Test SSL certificate first
  const sslValid = await testSSLCertificate(domain);
  
  if (!sslValid) {
    console.log('\n⚠️  SSL certificate issues detected. Telegram requires HTTPS with valid SSL.');
    console.log('   Please ensure your SSL certificate is properly configured.');
  }
  
  // Test webhook endpoints
  console.log('\n🌐 Testing Webhook Endpoints...');
  
  const endpoints = [
    { url: `${productionUrl}/api/telegram/webhook`, name: 'Main Bot Webhook' },
    { url: `${productionUrl}/api/telegram/super-admin`, name: 'Super Admin Webhook' },
    { url: `${productionUrl}/api/telegram/file-admin`, name: 'File Admin Webhook' },
    { url: `${productionUrl}/api/telegram/customer`, name: 'Customer Webhook' }
  ];
  
  let accessibleEndpoints = 0;
  
  for (const endpoint of endpoints) {
    const accessible = await testWebhookEndpoint(endpoint.url, endpoint.name);
    if (accessible) accessibleEndpoints++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Get webhook info for configured bots
  console.log('\n📱 Checking Bot Webhook Status...');
  
  const bots = [
    {
      name: 'Main Bot',
      token: process.env.TELEGRAM_BOT_TOKEN,
      enabled: !!process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_token'
    },
    {
      name: 'Super Admin Bot',
      token: process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN,
      enabled: !!process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN && process.env.TELEGRAM_SUPER_ADMIN_BOT_TOKEN !== 'your_token'
    }
  ];
  
  for (const bot of bots) {
    if (bot.enabled) {
      await getWebhookInfo(bot.token!, bot.name);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   SSL Certificate: ${sslValid ? '✅ Valid' : '❌ Issues detected'}`);
  console.log(`   Accessible Endpoints: ${accessibleEndpoints}/${endpoints.length}`);
  
  if (sslValid && accessibleEndpoints > 0) {
    console.log('\n🎉 Webhook configuration looks good!');
    console.log('\n📋 To test file notifications:');
    console.log('1. Upload a file through your admin panel');
    console.log('2. Check your Telegram bot for notifications');
    console.log('3. Monitor server logs for webhook requests');
  } else {
    console.log('\n⚠️  Issues detected. Please check:');
    console.log('1. SSL certificate configuration');
    console.log('2. Server accessibility from external networks');
    console.log('3. Firewall settings');
    console.log('4. Webhook endpoint implementations');
  }
}

main().catch(console.error);

