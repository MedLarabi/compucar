# Multi-Bot Telegram System Setup Guide

This guide will help you set up three different Telegram bots for different user roles in your CompuCar application.

## 🤖 Bot Overview

### 1. 🔧 Super Admin Bot
- **Purpose**: Full system control and comprehensive notifications
- **Features**: System alerts, order notifications, user management, analytics
- **Target Users**: Super administrators with full system access

### 2. 📁 File Admin Bot  
- **Purpose**: File tuning system management
- **Features**: File upload notifications, status management, estimated time setting
- **Target Users**: Administrators who handle file processing

### 3. 📱 Customer Bot
- **Purpose**: Customer notifications and support
- **Features**: File status updates, order confirmations, support commands
- **Target Users**: Customers receiving notifications

## 📋 Prerequisites

1. **Telegram Account**: You need a Telegram account
2. **BotFather Access**: Access to @BotFather on Telegram
3. **ngrok** (for development): To expose your local server for webhooks

## 🛠️ Step 1: Create the Bots

### Create Super Admin Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose a name: `CompuCar Super Admin`
4. Choose a username: `compucar_super_admin_bot` (must be unique)
5. Save the bot token (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Create File Admin Bot
1. Send `/newbot` to @BotFather again
2. Choose a name: `CompuCar File Admin`
3. Choose a username: `compucar_file_admin_bot` (must be unique)
4. Save the bot token

### Create Customer Bot
1. Send `/newbot` to @BotFather again
2. Choose a name: `CompuCar Customer Support`
3. Choose a username: `compucar_customer_bot` (must be unique)
4. Save the bot token

## 🔑 Step 2: Get Chat IDs

### For Super Admin Bot:
1. Start a conversation with your Super Admin bot
2. Send any message (e.g., "Hello")
3. Visit: `https://api.telegram.org/bot<YOUR_SUPER_ADMIN_BOT_TOKEN>/getUpdates`
4. Find your chat ID in the response (e.g., `"id": 123456789`)

### For File Admin Bot:
1. Start a conversation with your File Admin bot
2. Send any message
3. Visit: `https://api.telegram.org/bot<YOUR_FILE_ADMIN_BOT_TOKEN>/getUpdates`
4. Find your chat ID

### Customer Bot Note:
Customer bot doesn't need a fixed chat ID as it will receive chat IDs dynamically when customers interact with it.

## 🔧 Step 3: Configure Environment Variables

Add these variables to your `.env` or `.env.local` file:

```env
# Multi-Bot Telegram Configuration
TELEGRAM_ENABLED=true

# Super Admin Bot (Full system control)
TELEGRAM_SUPER_ADMIN_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_SUPER_ADMIN_CHAT_ID=123456789
TELEGRAM_SUPER_ADMIN_ENABLED=true

# File Admin Bot (File tuning system only)
TELEGRAM_FILE_ADMIN_BOT_TOKEN=987654321:ZYXwvuTSRqponMLKjihGFEdcba
TELEGRAM_FILE_ADMIN_CHAT_ID=987654321
TELEGRAM_FILE_ADMIN_ENABLED=true

# Customer Bot (Notifications only)
TELEGRAM_CUSTOMER_BOT_TOKEN=555666777:QWErtyUIOpASDfghJKLzxcVBNm
TELEGRAM_CUSTOMER_BOT_ENABLED=true

# Legacy configuration (for backward compatibility)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 🌐 Step 4: Setup Webhooks

### For Development (using ngrok):

1. **Install ngrok**: Download from https://ngrok.com/
2. **Start your application**: `npm run dev`
3. **Expose with ngrok**: `ngrok http 3000`
4. **Copy the HTTPS URL**: e.g., `https://abc123.ngrok-free.app`
5. **Update NEXTAUTH_URL**: Add to your `.env`: `NEXTAUTH_URL=https://abc123.ngrok-free.app`
6. **Setup webhooks**: Run the webhook setup script

```bash
npx tsx scripts/setup-multi-bot-webhooks.ts
```

### For Production:

1. **Deploy your application** to your production server
2. **Update NEXTAUTH_URL** with your production domain
3. **Run webhook setup**:

```bash
npx tsx scripts/setup-multi-bot-webhooks.ts
```

## 🧪 Step 5: Test the System

Run the comprehensive test script:

```bash
npx tsx scripts/test-multi-bot-system.ts
```

This will:
- Test all bot connections
- Send test messages
- Verify file admin features
- Check super admin notifications
- Validate customer bot configuration

## 📱 Step 6: Bot Commands and Features

### Super Admin Bot Commands:
- `/start` - Welcome message and available commands
- `/stats` - System statistics (users, orders, files, revenue)
- `/users` - User management overview
- `/orders` - Order management overview
- `/files` - File management overview
- `/payments` - Payment overview
- `/system` - System status check

### File Admin Bot Features:
- **Automatic Notifications**: Receives notifications when new files are uploaded
- **Interactive Buttons**: 
  - ✅ Set to READY
  - ⏳ Set to PENDING  
  - ⏰ Set Estimated Time (5min, 10min, 15min, 20min, 30min, 45min, 1h, 2h, 4h, 1 day)
- **Real-time Updates**: Messages update automatically when actions are performed

### Customer Bot Commands:
- `/start` - Welcome message
- `/files` - View your files
- `/orders` - Track your orders
- `/support` - Contact support
- `/help` - Get help

### Customer Bot Notifications:
- File status updates (received, pending, ready)
- Order confirmations
- Estimated processing times
- Payment confirmations

## 🔄 Step 7: Integration Points

### Database Schema Addition (Optional):
To enable customer Telegram notifications, add a `telegramChatId` field to your User model:

```prisma
model User {
  // ... existing fields
  telegramChatId String? // Optional: Customer's Telegram chat ID
}
```

### Customer Registration:
When customers interact with the Customer bot, you can store their chat ID:

```typescript
// In your customer bot webhook handler
const chatId = message.chat.id.toString();
const userId = getUserIdFromSomeMethod(); // Your method to identify the user

await prisma.user.update({
  where: { id: userId },
  data: { telegramChatId: chatId }
});
```

## 🛡️ Security Considerations

1. **Bot Tokens**: Keep bot tokens secure and never commit them to version control
2. **Webhook URLs**: Only use HTTPS for webhook URLs
3. **Chat ID Verification**: Verify chat IDs belong to authorized users
4. **Rate Limiting**: Implement rate limiting for webhook endpoints
5. **Error Handling**: Implement proper error handling and logging

## 🔍 Troubleshooting

### Common Issues:

1. **Bot not responding**:
   - Check bot token is correct
   - Verify bot is enabled in environment variables
   - Check webhook is set correctly

2. **Webhook not receiving updates**:
   - Ensure NEXTAUTH_URL is accessible from internet
   - Check webhook URL is HTTPS
   - Verify webhook is set with correct URL

3. **Messages not sending**:
   - Check chat ID is correct
   - Verify bot token has proper permissions
   - Check bot is not blocked by user

4. **Buttons not working**:
   - Ensure webhook is properly configured
   - Check callback data format
   - Verify webhook handler is processing callback queries

### Debug Commands:

```bash
# Test individual bot
npx tsx scripts/test-multi-bot-system.ts

# Check webhook status
curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo

# Get bot updates
curl https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
```

## 📊 Monitoring and Logs

Monitor your bots by checking:
- Application logs for Telegram API errors
- Webhook endpoint logs
- Database notification records
- Bot response times

## 🎯 Best Practices

1. **Message Formatting**: Use HTML formatting for better readability
2. **Button Limits**: Telegram limits inline keyboards to 100 buttons
3. **Message Length**: Keep messages under 4096 characters
4. **Error Handling**: Always handle API errors gracefully
5. **User Privacy**: Only send notifications to users who opted in
6. **Testing**: Test all bot features in development before production

## 🚀 Going Live

1. **Production Deployment**: Deploy your application to production
2. **Environment Variables**: Set all production environment variables
3. **Webhook Setup**: Configure webhooks with production URLs
4. **Testing**: Run comprehensive tests
5. **Monitoring**: Set up monitoring and alerting
6. **Documentation**: Document bot usage for your team

Your multi-bot Telegram system is now ready! 🎉
