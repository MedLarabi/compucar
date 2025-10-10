# 🔧 Telegram Bot Status Change Troubleshooting Guide

This guide helps diagnose and fix issues with Telegram bot status change functionality.

## 🚨 Problem Description

**Issue**: Telegram bot notifications are working, but changing file status from Telegram bot buttons is not working.

**Symptoms**:
- Notifications arrive correctly in Telegram
- Clicking status change buttons doesn't update file status
- No error messages or feedback when clicking buttons
- Database status remains unchanged

## 🔍 Diagnosis Steps

### Step 1: Run the Debug Script

```bash
npx tsx scripts/debug-telegram-status.ts
```

This script will:
- ✅ Check Telegram bot configuration
- ✅ Test bot connection
- ✅ Verify webhook status
- ✅ Send a test message with status buttons
- ✅ Show detailed logging information

### Step 2: Check Server Logs

When you click a status button, watch your server logs for:

```
🤖 Telegram webhook received: {...}
📱 Received callback query: file_status_123_PENDING
📱 Chat ID: 123456789
📱 Message ID: 456
📋 Parsed parts: ['file', 'status', '123', 'PENDING']
🔄 Processing file status change: { fileId: '123', newStatus: 'PENDING' }
```

If you don't see these logs, the webhook isn't receiving the callback.

### Step 3: Verify Webhook Configuration

Check if webhook is properly set:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Should return:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 🛠️ Common Issues and Fixes

### Issue 1: Webhook Not Set or Incorrect

**Problem**: No webhook URL or wrong URL
**Fix**: Set the correct webhook

```bash
# For development with ngrok
npx tsx scripts/setup-telegram-webhook.ts https://your-ngrok-url.ngrok-free.app

# For production
npx tsx scripts/setup-telegram-webhook.ts https://your-domain.com
```

### Issue 2: Database Connection Issues

**Problem**: Prisma database errors in logs
**Fix**: Check database connection

```bash
# Test database connection
npx prisma db push
npx prisma generate
```

### Issue 3: Environment Variables Missing

**Problem**: Bot token or chat ID not configured
**Fix**: Check `.env.local` file:

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
NEXTAUTH_URL=https://your-domain.com
```

### Issue 4: Invalid File ID in Callback Data

**Problem**: File not found errors in logs
**Fix**: The callback data format should be: `file_status_{fileId}_{status}`

Check that:
- File ID exists in database
- Callback data is properly formatted
- No special characters in file ID

### Issue 5: Network/Firewall Issues

**Problem**: Telegram can't reach your webhook
**Fix**: 
- Ensure your server is publicly accessible
- Check firewall settings
- Verify HTTPS is working (Telegram requires HTTPS)
- Test webhook URL manually: `curl https://your-domain.com/api/telegram/webhook`

### Issue 6: Bot Permissions

**Problem**: Bot doesn't have proper permissions
**Fix**: 
- Ensure bot is added to the chat
- Bot should have permission to send/edit messages
- Check bot settings with @BotFather

## 🔧 Enhanced Fixes Applied

The following improvements have been made to fix the status change issue:

### 1. Enhanced Error Handling
- ✅ Added comprehensive try-catch blocks
- ✅ Detailed error logging with stack traces
- ✅ Graceful handling of partial failures
- ✅ Proper HTTP status codes in responses

### 2. Better Logging
- ✅ Full webhook payload logging
- ✅ Step-by-step process logging
- ✅ Chat ID and message ID tracking
- ✅ Database operation confirmations

### 3. Input Validation
- ✅ Status validation against allowed values
- ✅ File existence verification
- ✅ Callback data format validation

### 4. Database Improvements
- ✅ Added `updatedDate` field updates
- ✅ Audit log creation for status changes
- ✅ Better error handling for database operations

### 5. Notification Reliability
- ✅ Separated notification failures from core functionality
- ✅ Real-time updates with error handling
- ✅ Customer notification with fallback

## 🧪 Testing Process

### 1. Manual Testing
1. Upload a file through the web interface
2. Check that you receive a Telegram notification
3. Click the status change buttons
4. Verify the status changes in the admin panel
5. Check that customer receives status update notification

### 2. Automated Testing
```bash
# Run the debug script
npx tsx scripts/debug-telegram-status.ts

# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# Test direct API call
curl -X POST "https://your-domain.com/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{"callback_query":{"id":"test","data":"file_status_test_PENDING","message":{"chat":{"id":123456789},"message_id":1}}}'
```

## 📊 Success Indicators

When everything is working correctly, you should see:

1. **In Telegram**: 
   - Status buttons respond immediately
   - Message updates to show new status
   - Checkmarks appear next to current status

2. **In Server Logs**:
   ```
   🤖 Telegram webhook received: {...}
   🔄 Processing file status change: {...}
   💾 Updating file status in database...
   ✅ File status updated successfully: PENDING
   📝 Audit log created
   📢 Sending customer notification...
   ✅ Customer notification sent
   ⚡ Sending real-time update...
   ✅ Real-time update sent
   ✅ Answering callback query...
   📝 Updating Telegram message...
   ✅ Telegram message updated
   🎉 File status change completed successfully
   ```

3. **In Database**:
   - File status updated in `TuningFile` table
   - New entry in `AuditLog` table
   - Customer notification in `Notification` table

4. **In Web Interface**:
   - File status updates in real-time (no page refresh needed)
   - Admin panel shows updated status
   - Customer sees status change notification

## 🆘 Emergency Recovery

If status changes are still not working:

1. **Restart the application**:
   ```bash
   # Development
   npm run dev

   # Production
   pm2 restart all
   ```

2. **Reset the webhook**:
   ```bash
   # Clear webhook
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
   
   # Set new webhook
   npx tsx scripts/setup-telegram-webhook.ts <your-url>
   ```

3. **Check bot health**:
   ```bash
   npx tsx scripts/diagnose-telegram-bots.ts
   ```

4. **Manual database check**:
   ```sql
   -- Check recent files
   SELECT id, originalFilename, status, updatedDate 
   FROM TuningFile 
   ORDER BY createdDate DESC 
   LIMIT 5;
   
   -- Check audit logs
   SELECT * FROM AuditLog 
   WHERE action = 'STATUS_CHANGE' 
   ORDER BY createdAt DESC 
   LIMIT 10;
   ```

## 📞 Support

If the issue persists after following this guide:

1. Check the enhanced webhook logs for specific error messages
2. Run the debug script and share the output
3. Verify all environment variables are correctly set
4. Test with a fresh file upload and status change
5. Check database connectivity and permissions

The enhanced error handling and logging should provide clear indicators of what's failing in the status change process.
