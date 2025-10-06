import { NextRequest, NextResponse } from 'next/server';
import { MultiBotTelegramService, BotType } from '@/lib/services/multi-bot-telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle callback queries from Customer bot (if any)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const chatId = callbackQuery.message.chat.id.toString();
      const callbackQueryId = callbackQuery.id;

      console.log('📱 Customer bot callback query:', callbackData);

      // Parse callback data - Customer bot uses prefixed callback data
      const parts = callbackData.split('_');
      
      if (parts[0] === 'customer') {
        const action = parts[1];
        
        switch (action) {
          case 'view':
            // Handle view actions (files, orders, etc.)
            const entityType = parts[2];
            const entityId = parts[3];
            
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.CUSTOMER,
              callbackQueryId,
              `🔍 Opening ${entityType}...`,
              false
            );
            break;
            
          case 'track':
            // Handle tracking actions
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.CUSTOMER,
              callbackQueryId,
              '📦 Tracking your order...',
              false
            );
            break;
            
          default:
            await MultiBotTelegramService.answerCallbackQuery(
              BotType.CUSTOMER,
              callbackQueryId,
              '❓ Unknown action',
              false
            );
        }
      }
    }

    // Handle regular messages from Customer bot
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const text = message.text;

      console.log('📱 Customer bot message:', text);

      // Handle commands
      if (text?.startsWith('/')) {
        const command = text.split(' ')[0];
        
        switch (command) {
          case '/start':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
📱 <b>Welcome to CompuCar!</b>

🚗 Your trusted partner for ECU tuning and automotive solutions.

<b>Available Commands:</b>
📁 /files - View your files
🛒 /orders - Track your orders
📞 /support - Contact support
ℹ️ /help - Get help

We'll notify you about:
• File status updates
• Order confirmations
• Processing completion

Stay tuned! 🚀
              `.trim(),
              chatId
            );
            break;
            
          case '/files':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
📁 <b>Your Files</b>

To view your files, please visit:
🔗 <a href="${process.env.NEXTAUTH_URL}/files">View Files</a>

You'll receive notifications here when:
• Files are received ✅
• Processing starts ⏳
• Files are ready 🎉
              `.trim(),
              chatId
            );
            break;
            
          case '/orders':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
🛒 <b>Your Orders</b>

To track your orders, please visit:
🔗 <a href="${process.env.NEXTAUTH_URL}/orders">Track Orders</a>

You'll receive notifications here for:
• Order confirmations 📋
• Payment updates 💳
• Delivery status 📦
              `.trim(),
              chatId
            );
            break;
            
          case '/support':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
📞 <b>Customer Support</b>

Need help? We're here for you!

📧 <b>Email:</b> support@compucar.com
🌐 <b>Website:</b> ${process.env.NEXTAUTH_URL}
⏰ <b>Hours:</b> 9 AM - 6 PM (Mon-Fri)

For urgent matters, please contact us directly.
              `.trim(),
              chatId
            );
            break;
            
          case '/help':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
ℹ️ <b>Help & Information</b>

<b>What we do:</b>
🔧 ECU Tuning Services
🚗 Performance Optimization
📊 Custom Modifications

<b>How it works:</b>
1. Upload your ECU file
2. Select modifications
3. We process your file
4. Download the tuned file

<b>Need assistance?</b>
Use /support for contact information.
              `.trim(),
              chatId
            );
            break;
            
          default:
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              '❓ Unknown command. Use /help to see available commands.',
              chatId
            );
        }
      } else {
        // Handle regular text messages
        await MultiBotTelegramService.sendMessage(
          BotType.CUSTOMER,
          `
👋 Hello! 

I'm here to keep you updated on your CompuCar orders and files.

Use /help to see what I can do for you, or visit our website:
🔗 <a href="${process.env.NEXTAUTH_URL}">CompuCar.com</a>
          `.trim(),
          chatId
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing Customer bot webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
