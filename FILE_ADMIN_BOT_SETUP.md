# 📁 File Admin Bot Setup Guide

This guide will help you configure the **File Admin Bot** for an administrator who handles only file modifications and tuning.

## 🎯 **Purpose**

The File Admin Bot is designed for administrators who:
- Process ECU file modifications
- Handle file tuning requests
- Manage file status updates
- Set estimated processing times
- Focus only on the file tuning system (not orders, users, or other admin tasks)

## 🚀 **Step-by-Step Setup**

### **Step 1: Create the Bot with BotFather**

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose a name: `CompuCar File Admin` (or your preferred name)
4. Choose a username: `compucar_file_admin_bot` (must be unique)
5. **Save the bot token** you receive (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### **Step 2: Get the File Admin's Chat ID**

1. Have your **file admin** start a conversation with the new bot
2. File admin sends any message (e.g., "Hello")
3. Visit this URL in browser (replace `<BOT_TOKEN>` with your actual token):
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
4. Find the chat ID in the response (e.g., `"id": 987654321`)

### **Step 3: Configure Environment Variables**

Add these to your `.env.local` file on your VPS:

```env
# File Admin Bot Configuration
TELEGRAM_FILE_ADMIN_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_FILE_ADMIN_CHAT_ID=987654321
TELEGRAM_FILE_ADMIN_ENABLED=true
```

### **Step 4: Run the Setup Script**

On your VPS, run:

```bash
npx tsx scripts/setup-file-admin-bot.ts
```

This script will:
- ✅ Verify bot connection
- ✅ Set up the webhook to `https://compucar.pro/api/telegram/file-admin`
- ✅ Send a test message to confirm everything works
- ✅ Provide setup confirmation

## 🔧 **File Admin Bot Features**

### **Automatic Notifications**
When a customer uploads a file, the File Admin receives:
- 📄 **File details** (name, size, customer info)
- 🔧 **Selected modifications** (Stage 1, DPF Delete, etc.)
- 💬 **Customer comments** and DTC codes
- 🔗 **Direct link** to admin panel

### **Interactive Status Buttons**
- ✅ **Set to READY** - Mark file as completed and ready for download
- ⏳ **Set to PENDING** - Mark file as in progress
- 📥 **Set to RECEIVED** - Confirm file received
- ⏰ **Set Estimated Time** - Choose processing time (5min to 1 day)

### **Real-time Updates**
- Messages update automatically when actions are performed
- Customer receives instant notifications of status changes
- Admin panel reflects changes immediately

## 📱 **How It Works**

### **1. File Upload Notification**
```
📁 New File Upload

📄 File: stage1_golf_tdi.bin
👤 Customer: Ahmed Benali
💰 Price: Not set
🔧 Modifications: Stage 1 Tune, DPF Delete
💬 Comment: "Please remove DPF and add stage 1"

🔗 View in Admin Panel

[✅ Set to READY] [⏳ Set to PENDING] [⏰ Set Time]
```

### **2. Status Change Confirmation**
When you click a button:
```
✅ File status updated to PENDING

📄 File: stage1_golf_tdi.bin
📊 Status: PENDING
⏰ Estimated Time: 30 minutes
🕐 Updated: 2024-01-15 14:30:25
```

### **3. Customer Notification**
Customer automatically receives:
```
🔄 File Status Update

Your file "stage1_golf_tdi.bin" status changed to PENDING
⏰ Estimated processing time: 30 minutes

Track your file: compucar.pro/files
```

## 🧪 **Testing the Setup**

### **Test 1: Bot Connection**
Run the setup script and verify you receive the welcome message.

### **Test 2: File Upload**
1. Have a test customer upload a file
2. Verify File Admin receives notification
3. Click status buttons to test functionality

### **Test 3: Status Changes**
1. Click different status buttons
2. Check admin panel shows updated status
3. Verify customer receives status notifications

## 🔍 **Troubleshooting**

### **Issue: Bot not receiving notifications**
**Solution**: Check these settings:
```bash
# Verify environment variables
echo $TELEGRAM_FILE_ADMIN_ENABLED
echo $TELEGRAM_FILE_ADMIN_BOT_TOKEN
echo $TELEGRAM_FILE_ADMIN_CHAT_ID

# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

### **Issue: Buttons not working**
**Solution**: 
1. Ensure webhook is set to `https://compucar.pro/api/telegram/file-admin`
2. Check server logs when clicking buttons
3. Verify bot token is correct

### **Issue: Customer not receiving notifications**
**Solution**:
1. Check notification service is enabled
2. Verify customer has valid contact info
3. Check notification logs in admin panel

## 🎯 **File Admin Workflow**

### **Daily Workflow:**
1. **Morning**: Check for overnight file uploads
2. **Processing**: Download files, apply modifications
3. **Status Updates**: Use Telegram buttons to update status
4. **Time Estimates**: Set realistic processing times
5. **Completion**: Mark files as READY when done

### **Status Guidelines:**
- **RECEIVED**: File uploaded, not yet started
- **PENDING**: Currently working on the file
- **READY**: File completed and ready for download

### **Time Estimates:**
- **Simple modifications**: 5-15 minutes
- **Complex tunes**: 30-60 minutes  
- **Multiple modifications**: 1-2 hours
- **Special requests**: 2-4 hours or 1 day

## 🔒 **Security Notes**

- File Admin Bot only handles file tuning system
- No access to orders, payments, or user management
- Limited to file status changes and notifications
- Separate from Super Admin Bot for security

## 📊 **Monitoring**

### **Daily Checks:**
- Number of files processed
- Average processing time
- Customer satisfaction
- Bot response times

### **Weekly Reviews:**
- Processing efficiency
- Common modification requests
- Customer feedback
- System performance

## 🆘 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test with the debug script: `npx tsx scripts/debug-telegram-status.ts`
4. Verify all environment variables are set correctly

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ File Admin receives instant notifications for new uploads
- ✅ Status buttons work and update the database
- ✅ Customers receive automatic status notifications
- ✅ Admin panel shows real-time status changes
- ✅ Processing times are accurately communicated

Your File Admin Bot is now ready to handle all file tuning operations efficiently! 🚀
