# 🤖 Telegram Bot Setup Guide for CompuCar Admin Notifications

This guide will help you set up a Telegram bot to receive instant notifications on your phone for admin events like new orders, file uploads, and customer reviews.

## 📱 Why Telegram Bot?

- **Instant delivery** - notifications arrive immediately on your phone
- **Free to use** - no SMS costs
- **Rich formatting** - supports emojis, buttons, and links
- **Reliable** - excellent uptime and delivery
- **Cross-platform** - works on all devices
- **Easy setup** - simple API integration

## 🚀 Step-by-Step Setup

### Step 1: Create a Telegram Bot

1. **Open Telegram** on your phone or computer
2. **Search for @BotFather** and start a chat
3. **Send the command:** `/newbot`
4. **Enter a name** for your bot (e.g., "CompuCar Admin Bot")
5. **Enter a username** for your bot (e.g., "compucar_admin_bot")
6. **Copy the bot token** that BotFather gives you (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

1. **Start a chat** with your new bot
2. **Send any message** to the bot (e.g., "Hello")
3. **Visit this URL** in your browser (replace `YOUR_BOT_TOKEN` with your actual token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. **Find your chat ID** in the response (looks like: `123456789`)
5. **Copy the chat ID** for later use

### Step 3: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Telegram Bot Configuration
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Step 4: Test the Integration

Run the test script to verify everything is working:

```bash
npx tsx scripts/test-telegram-bot.ts
```

## 📋 Notification Types

Your bot will send notifications for:

### 🛒 **New Orders**
- Order ID and customer name
- Total amount and item count
- Direct link to view the order

### 📁 **File Uploads**
- Customer name and filename
- File size and modifications requested
- Direct link to process the file

### 👤 **User Registrations**
- New user name and email
- User role (customer/admin)
- Direct link to view user profile

### 💳 **Payments**
- Order ID and customer name
- Payment amount and method
- Direct link to view the order

### 📊 **File Status Updates**
- File name and customer
- Status change (PENDING → READY)
- Estimated processing time

### 🚨 **System Alerts**
- Error notifications
- Warning messages
- System information

## 🎨 Message Format

Notifications include:
- **Emojis** for visual clarity
- **Bold text** for important information
- **Clickable links** to admin pages
- **Structured layout** for easy reading

Example notification:
```
🛒 New Order Received!

📋 Order ID: ORD-001
👤 Customer: John Doe
💰 Total: $150.00
📦 Items: 2

🔗 View Order
```

## 🔧 Advanced Configuration

### Multiple Admin Notifications

To send notifications to multiple admins, you can:

1. **Create a group** with all admins
2. **Add your bot** to the group
3. **Use the group chat ID** instead of individual chat ID

### Custom Notifications

You can add custom notification types by:

1. **Adding new methods** to `TelegramService`
2. **Integrating with existing** notification system
3. **Calling the method** from your API endpoints

## 🛠️ Troubleshooting

### Bot Not Responding
- Check if `TELEGRAM_ENABLED=true`
- Verify bot token is correct
- Ensure chat ID is correct
- Check if bot is started (send `/start` to your bot)

### Notifications Not Received
- Run the test script to verify setup
- Check server logs for errors
- Verify environment variables are loaded
- Test with a simple message first

### Permission Issues
- Make sure bot has permission to send messages
- Check if bot is blocked or restricted
- Verify chat ID is correct

## 📱 Mobile Setup

### iPhone
1. Download Telegram from App Store
2. Create account or sign in
3. Follow the setup steps above
4. Enable notifications in Settings

### Android
1. Download Telegram from Google Play
2. Create account or sign in
3. Follow the setup steps above
4. Enable notifications in Settings

## 🔒 Security Notes

- **Keep your bot token secret** - don't share it publicly
- **Use environment variables** - never hardcode tokens
- **Regularly rotate tokens** if needed
- **Monitor bot usage** for any suspicious activity

## 🎉 You're All Set!

Once configured, you'll receive instant notifications on your phone for:
- ✅ New customer orders
- ✅ File uploads for tuning
- ✅ Customer reviews and comments
- ✅ Payment confirmations
- ✅ System alerts and errors
- ✅ User registrations

Your CompuCar admin notifications are now active! 🚀
