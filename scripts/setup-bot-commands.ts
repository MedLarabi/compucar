#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function setupBotCommands() {
  const botToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
  
  console.log('📱 Setting up Customer Bot Commands Menu\n');
  
  if (!botToken) {
    console.log('❌ TELEGRAM_CUSTOMER_BOT_TOKEN not found in environment');
    return;
  }
  
  console.log(`📱 Bot Token: ${botToken.substring(0, 10)}...`);
  
  // Define bot commands for the menu
  const commands = [
    {
      command: "start",
      description: "🚀 Get started and link your account"
    },
    {
      command: "files",
      description: "📁 View your files"
    },
    {
      command: "orders", 
      description: "🛒 Track your orders"
    },
    {
      command: "support",
      description: "📞 Contact support"
    },
    {
      command: "unlink",
      description: "🔓 Unlink your account"
    },
    {
      command: "help",
      description: "ℹ️ Show help and commands"
    }
  ];
  
  try {
    console.log('⚙️ Setting up bot commands menu...');
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: commands
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Bot commands menu set successfully!');
      console.log('\n📋 Commands added to menu:');
      commands.forEach(cmd => {
        console.log(`   /${cmd.command} - ${cmd.description}`);
      });
      
      console.log('\n🎉 Customers can now:');
      console.log('1. Type "/" to see the commands menu');
      console.log('2. Click on any command from the menu');
      console.log('3. The /start command will be prominently displayed');
      
    } else {
      console.log('❌ Failed to set commands menu:', data.description);
    }
    
  } catch (error) {
    console.log('❌ Error setting up commands menu:', error);
  }
}

async function main() {
  try {
    await setupBotCommands();
  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
