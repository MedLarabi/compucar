import { NextRequest, NextResponse } from 'next/server';
import { MultiBotTelegramService, BotType } from '@/lib/services/multi-bot-telegram';
import { prisma } from '@/lib/database/prisma';
import { 
  linkTelegramAccount, 
  findUserByTelegramChatId, 
  notifyCustomerViaTelegram
} from '@/lib/services/customer-telegram-auth';
import type { TelegramUser } from '@/lib/services/customer-telegram-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📱 Customer Bot webhook received:', JSON.stringify(body, null, 2));
    
    // Handle callback queries from Customer bot
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
            
          case 'link':
            // Handle account linking
            const email = parts[2]; // customer_link_email@domain.com
            if (email) {
              const success = await linkTelegramAccount(
                chatId, 
                callbackQuery.from as TelegramUser, 
                email.replace('%40', '@') // URL decode @ symbol
              );
              
              if (success) {
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.CUSTOMER,
                  callbackQueryId,
                  '✅ Account linked successfully!',
                  false
                );
                
                // Send welcome message
                await MultiBotTelegramService.sendMessage(
                  BotType.CUSTOMER,
                  `
🎉 <b>Account Successfully Linked!</b>

✅ Your Telegram account is now connected to your CompuCar account.

<b>You'll now receive instant notifications for:</b>
📁 File status updates (received, processing, ready)
🛒 Order confirmations and tracking
💳 Payment confirmations
⏰ Processing time estimates

<b>Available Commands:</b>
📁 /files - View your files
🛒 /orders - Track your orders
📞 /support - Contact support
ℹ️ /help - Get help

Welcome to instant notifications! 🚀
                  `.trim(),
                  chatId
                );
              } else {
                await MultiBotTelegramService.answerCallbackQuery(
                  BotType.CUSTOMER,
                  callbackQueryId,
                  '❌ Failed to link account. Please try again.',
                  true
                );
              }
            }
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
      const telegramUser = message.from as TelegramUser;

      console.log('📱 Customer bot message:', text);

      // Check if user is already linked
      const linkedUser = await findUserByTelegramChatId(chatId);

      // Handle commands
      if (text?.startsWith('/')) {
        const command = text.split(' ')[0];
        
        switch (command) {
          case '/start':
            if (linkedUser) {
              // User is already linked
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
📱 <b>Welcome back, ${linkedUser.firstName}!</b>

✅ Your account is already linked and ready for notifications.

<b>Available Commands:</b>
📁 /files - View your files
🛒 /orders - Track your orders
📞 /support - Contact support
ℹ️ /help - Get help
🔗 /link - Link different account

You'll receive instant notifications for file status updates! 🚀
                `.trim(),
                chatId
              );
            } else {
              // User needs to link their account
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
📱 <b>Welcome to CompuCar Customer Bot!</b>

🔗 To receive personalized notifications, you need to link your Telegram account to your CompuCar account.

<b>How to link your account:</b>

<b>Method 1: Quick Link</b>
Send your email address like this:
<code>/link your-email@example.com</code>

<b>Method 2: Manual Link</b>
1. Visit your CompuCar account settings
2. Go to Notifications section
3. Click "Link Telegram Account"
4. Enter the code we provide

<b>After linking, you'll receive:</b>
📁 File status updates (received, processing, ready)
🛒 Order confirmations and tracking
💳 Payment confirmations
⏰ Processing time estimates

Ready to get started? 🚀
                `.trim(),
                chatId
              );
            }
            break;
            
          case '/link':
            const emailMatch = text.match(/\/link\s+([^\s]+@[^\s]+\.[^\s]+)/);
            if (emailMatch) {
              const email = emailMatch[1].toLowerCase();
              
              // Check if user exists
              const user = await prisma.user.findUnique({
                where: { email }
              });
              
              if (user) {
                const success = await linkTelegramAccount(chatId, telegramUser, email);
                
                if (success) {
                  await MultiBotTelegramService.sendMessage(
                    BotType.CUSTOMER,
                    `
🎉 <b>Account Successfully Linked!</b>

✅ Your Telegram account is now connected to ${user.firstName} ${user.lastName}'s CompuCar account.

<b>You'll now receive instant notifications for:</b>
📁 File status updates
🛒 Order confirmations
💳 Payment updates
⏰ Processing estimates

<b>Available Commands:</b>
📁 /files - View your files
🛒 /orders - Track your orders
📞 /support - Contact support

Welcome to instant notifications! 🚀
                    `.trim(),
                    chatId
                  );
                } else {
                  await MultiBotTelegramService.sendMessage(
                    BotType.CUSTOMER,
                    `
❌ <b>Failed to Link Account</b>

This could happen if:
• Email is already linked to another Telegram account
• There was a technical error

Please try again or contact support.
                    `.trim(),
                    chatId
                  );
                }
              } else {
                await MultiBotTelegramService.sendMessage(
                  BotType.CUSTOMER,
                  `
❌ <b>Account Not Found</b>

No CompuCar account found with email: <code>${email}</code>

Please check:
• Email address is correct
• You have an account at compucar.pro
• Email is verified

Try again with: <code>/link your-correct-email@example.com</code>
                  `.trim(),
                  chatId
                );
              }
            } else {
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
🔗 <b>Link Your Account</b>

Please provide your CompuCar account email:

<b>Usage:</b> <code>/link your-email@example.com</code>

<b>Example:</b> <code>/link ahmed@gmail.com</code>

Make sure to use the same email address you registered with at compucar.pro
                `.trim(),
                chatId
              );
            }
            break;
            
          case '/files':
            if (linkedUser) {
              // Show user's files
              const userFiles = await prisma.tuningFile.findMany({
                where: { userId: linkedUser.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                  id: true,
                  originalFilename: true,
                  status: true,
                  createdAt: true
                }
              });
              
              let filesText = '';
              if (userFiles.length > 0) {
                filesText = '\n<b>Your Recent Files:</b>\n' + userFiles.map((file, index) => 
                  `${index + 1}. ${file.originalFilename}\n   Status: ${file.status} | ${file.createdAt.toLocaleDateString()}`
                ).join('\n\n');
              } else {
                filesText = '\n<i>No files uploaded yet.</i>';
              }
              
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
📁 <b>Your Files</b>
${filesText}

🔗 <a href="https://compucar.pro/files">View All Files</a>

You'll receive notifications here when:
• Files are received ✅
• Processing starts ⏳
• Files are ready 🎉
                `.trim(),
                chatId
              );
            } else {
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
🔗 <b>Account Not Linked</b>

Please link your account first to view your files:
<code>/link your-email@example.com</code>
                `.trim(),
                chatId
              );
            }
            break;
            
          case '/orders':
            if (linkedUser) {
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
🛒 <b>Your Orders</b>

🔗 <a href="https://compucar.pro/orders">Track Your Orders</a>

You'll receive notifications here for:
• Order confirmations 📋
• Payment updates 💳
• Delivery status 📦
                `.trim(),
                chatId
              );
            } else {
              await MultiBotTelegramService.sendMessage(
                BotType.CUSTOMER,
                `
🔗 <b>Account Not Linked</b>

Please link your account first to view your orders:
<code>/link your-email@example.com</code>
                `.trim(),
                chatId
              );
            }
            break;
            
          case '/support':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
📞 <b>Customer Support</b>

Need help? We're here for you!

<b>Contact Options:</b>
🌐 Website: https://compucar.pro/contact
📧 Email: support@compucar.pro
📱 Phone: +213 XXX XXX XXX

<b>Common Questions:</b>
• File processing times: Usually 30 minutes - 2 hours
• Supported file types: .bin, .hex, .ecu, .map, etc.
• Payment methods: Cash on Delivery (COD)

<b>Business Hours:</b>
Monday - Friday: 9:00 AM - 6:00 PM (GMT+1)
Saturday: 10:00 AM - 4:00 PM
Sunday: Closed

We'll respond as quickly as possible! 🚀
              `.trim(),
              chatId
            );
            break;
            
          case '/help':
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
ℹ️ <b>Help & Commands</b>

<b>Available Commands:</b>
🔗 <code>/link email@example.com</code> - Link your account
📁 <code>/files</code> - View your files
🛒 <code>/orders</code> - Track your orders
📞 <code>/support</code> - Contact support
ℹ️ <code>/help</code> - Show this help

<b>Getting Started:</b>
1. Link your account with <code>/link your-email@example.com</code>
2. Upload files at https://compucar.pro
3. Receive instant notifications here!

<b>Notifications You'll Receive:</b>
📁 File status updates (received → processing → ready)
🛒 Order confirmations and tracking
💳 Payment confirmations
⏰ Processing time estimates

Need more help? Use <code>/support</code> 🚀
              `.trim(),
              chatId
            );
            break;
            
          default:
            await MultiBotTelegramService.sendMessage(
              BotType.CUSTOMER,
              `
❓ <b>Unknown Command</b>

Available commands:
🔗 <code>/link email@example.com</code> - Link your account
📁 <code>/files</code> - View your files
🛒 <code>/orders</code> - Track your orders
📞 <code>/support</code> - Contact support
ℹ️ <code>/help</code> - Show help

Type <code>/help</code> for more information.
              `.trim(),
              chatId
            );
        }
      } else {
        // Handle non-command messages
        if (linkedUser) {
          await MultiBotTelegramService.sendMessage(
            BotType.CUSTOMER,
            `
👋 Hi ${linkedUser.firstName}!

I understand you want to chat, but I'm designed to send you notifications about your CompuCar account.

<b>Available Commands:</b>
📁 /files - View your files
🛒 /orders - Track your orders
📞 /support - Contact support
ℹ️ /help - Get help

For general questions, use <code>/support</code> to contact our team! 🚀
            `.trim(),
            chatId
          );
        } else {
          await MultiBotTelegramService.sendMessage(
            BotType.CUSTOMER,
            `
👋 Hello!

To get started, please link your CompuCar account:
<code>/link your-email@example.com</code>

Or type <code>/help</code> for more information.
            `.trim(),
            chatId
          );
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Customer Bot webhook error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}