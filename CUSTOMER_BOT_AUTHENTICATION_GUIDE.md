# 📱 Customer Bot Authentication System Setup Guide

This guide explains how to set up the **Customer Bot** with user authentication so each customer receives only their own notifications.

## 🎯 **Overview**

The Customer Bot authentication system allows customers to:
- Link their Telegram account to their CompuCar website account
- Receive instant notifications for their file status changes
- Access personalized commands and information
- Maintain privacy (only see their own data)

## 🛠️ **Setup Steps**

### **Step 1: Database Migration**

Add Telegram fields to the User table:

```bash
# Run the database migration
psql -d your_database -f add-telegram-fields.sql
```

Or manually add these fields:
```sql
ALTER TABLE "public"."users" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "public"."users" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "public"."users" ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);
ALTER TABLE "public"."users" ADD CONSTRAINT "users_telegramChatId_key" UNIQUE ("telegramChatId");
```

### **Step 2: Update Prisma Schema**

Run Prisma commands to sync the database:

```bash
npx prisma generate
npx prisma db push
```

### **Step 3: Create Customer Bot**

1. Go to @BotFather on Telegram
2. Send `/newbot`
3. Name: `CompuCar Customer Support`
4. Username: `compucar_customer_bot` (must be unique)
5. Save the bot token

### **Step 4: Configure Environment Variables**

Add to your `.env.local`:

```env
# Customer Bot Configuration
TELEGRAM_CUSTOMER_BOT_TOKEN=your-customer-bot-token-here
TELEGRAM_CUSTOMER_BOT_ENABLED=true
```

### **Step 5: Setup Customer Bot Webhook**

```bash
npx tsx scripts/setup-customer-bot-webhook.ts
```

## 🔗 **How Authentication Works**

### **Method 1: Quick Link (Recommended)**

Customers can link their account directly in Telegram:

1. Customer starts chat with Customer Bot: `/start`
2. Bot shows linking instructions
3. Customer sends: `/link their-email@example.com`
4. Bot verifies email exists in database
5. Bot links Telegram chat ID to user account
6. Customer receives confirmation and welcome message

### **Method 2: Website Integration (Future)**

You can add a "Link Telegram" button to user account settings:

1. User clicks "Link Telegram Account" in settings
2. System generates unique linking code
3. User sends code to Customer Bot
4. Bot verifies code and links accounts

## 📱 **Customer Bot Commands**

### **Available Commands:**

- `/start` - Welcome message and linking instructions
- `/link email@example.com` - Link Telegram account to website account
- `/files` - View recent files (requires linked account)
- `/orders` - View orders (requires linked account)
- `/support` - Contact support information
- `/help` - Show help and commands

### **Authentication Flow:**

```
Customer → /start → Bot checks if linked
    ↓
If NOT linked → Show linking instructions
    ↓
Customer → /link email@example.com
    ↓
Bot → Verify email exists → Link account → Welcome message
    ↓
Customer → Now receives instant notifications!
```

## 🔔 **Notification System**

### **When Customers Receive Notifications:**

1. **File Status Changes:**
   - File received (📥)
   - Processing started (⏳)
   - File ready for download (✅)

2. **Order Updates:**
   - Order confirmed
   - Payment received
   - Shipping updates

3. **Processing Updates:**
   - Estimated time set
   - Admin comments added

### **Notification Format:**

```
📥 File Status Update

📄 File: stage1_golf_tdi.bin
📊 Status: PENDING
💬 Update: Your file is currently being processed by our team.

🔗 View Your Files

🕐 Updated: 2024-01-15 14:30:25
```

## 🔒 **Security & Privacy**

### **Data Protection:**
- Each customer only sees their own data
- Telegram chat IDs are encrypted in database
- No sensitive information in Telegram messages
- Secure linking process with email verification

### **Privacy Features:**
- Customers can unlink their account anytime
- No personal data stored in Telegram
- All sensitive operations redirect to website
- Audit trail of all linking/unlinking actions

## 🧪 **Testing the System**

### **Test Customer Linking:**

1. Create a test customer account on your website
2. Start chat with Customer Bot
3. Use `/link test-customer@example.com`
4. Verify linking works
5. Test file status notifications

### **Test Notifications:**

1. Upload a file as the test customer
2. Change file status from File Admin Bot
3. Verify customer receives Telegram notification
4. Check notification appears in both Telegram and website

## 🛠️ **Administration**

### **View Linked Customers:**

```sql
SELECT 
  firstName, 
  lastName, 
  email, 
  telegramUsername, 
  telegramLinkedAt 
FROM users 
WHERE telegramChatId IS NOT NULL;
```

### **Unlink Customer Account:**

```sql
UPDATE users 
SET 
  telegramChatId = NULL,
  telegramUsername = NULL,
  telegramLinkedAt = NULL
WHERE email = 'customer@example.com';
```

### **Monitor Telegram Notifications:**

Check server logs for:
```
📱 Sending Telegram notification to customer...
✅ Telegram notification sent to John Doe
```

## 🔧 **Troubleshooting**

### **Customer Can't Link Account:**

1. **Email not found:** Customer using wrong email
2. **Already linked:** Email linked to different Telegram account
3. **Bot token issues:** Check TELEGRAM_CUSTOMER_BOT_TOKEN
4. **Database issues:** Check database connection

### **Notifications Not Received:**

1. **Account not linked:** Customer needs to link account first
2. **Bot token missing:** Configure TELEGRAM_CUSTOMER_BOT_TOKEN
3. **Webhook not set:** Run webhook setup script
4. **Database issues:** Check telegramChatId field

### **Common Issues:**

```bash
# Check bot configuration
npx tsx scripts/test-customer-bot.ts

# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# Test database connection
npx prisma studio
```

## 📊 **Monitoring & Analytics**

### **Track Usage:**
- Number of linked customers
- Notification delivery rates
- Most used commands
- Customer engagement metrics

### **Database Queries:**

```sql
-- Linked customers count
SELECT COUNT(*) FROM users WHERE telegramChatId IS NOT NULL;

-- Recent linkings
SELECT firstName, lastName, telegramLinkedAt 
FROM users 
WHERE telegramLinkedAt > NOW() - INTERVAL '7 days';

-- Notification success rate (check logs)
```

## 🚀 **Going Live**

### **Production Checklist:**

- ✅ Database migration completed
- ✅ Customer Bot created and configured
- ✅ Environment variables set
- ✅ Webhook configured for production domain
- ✅ Notification system tested
- ✅ Privacy and security verified
- ✅ Customer support trained on linking process

### **Launch Strategy:**

1. **Soft Launch:** Test with internal team
2. **Beta Test:** Invite select customers to test
3. **Gradual Rollout:** Enable for all customers
4. **Monitor:** Watch for issues and customer feedback
5. **Optimize:** Improve based on usage patterns

Your Customer Bot authentication system is now ready to provide personalized, secure notifications to your customers! 🎉
