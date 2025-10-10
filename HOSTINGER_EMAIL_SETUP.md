# 📧 Hostinger Email Setup for CompuCar

## 🎯 Quick Setup Guide

### **Step 1: Create Email Accounts in Hostinger**

1. **Log in to Hostinger Control Panel**
   - Go to [hpanel.hostinger.com](https://hpanel.hostinger.com/)
   - Enter your Hostinger credentials

2. **Navigate to Email Section**
   - Click on **"Email"** in the left sidebar
   - Select **"Email Accounts"**

3. **Create Required Email Accounts**
   Create these email accounts for your CompuCar website:

   **Primary System Email:**
   ```
   Email: noreply@compucar.pro
   Password: [Create a strong password]
   Purpose: System notifications, file updates
   ```

   **Admin Email:**
   ```
   Email: admin@compucar.pro
   Password: [Create a strong password]
   Purpose: Admin notifications, alerts
   ```

   **Support Email:**
   ```
   Email: support@compucar.pro
   Password: [Create a strong password]
   Purpose: Customer support communications
   ```

### **Step 2: Get SMTP Configuration**

Hostinger provides these SMTP settings:
```
SMTP Server: smtp.hostinger.com
SMTP Port: 587 (STARTTLS) or 465 (SSL/TLS)
Security: STARTTLS (recommended)
Authentication: Required
```

### **Step 3: Update Your .env File**

Add these configuration settings to your `.env` file:

```env
# Hostinger Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@compucar.pro
SMTP_PASS=your-noreply-email-password
FROM_NAME=CompuCar File Tuning
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro

# Enable email notifications
EMAIL_ENABLED=true

# Optional: Additional email addresses
SUPPORT_EMAIL=support@compucar.pro
BACKUP_ADMIN_EMAIL=admin@compucar.pro
```

### **Step 4: Test Email Configuration**

Run the email configuration test:
```bash
npx tsx test-email-config.ts
```

Expected output:
```
📧 CompuCar Email Configuration Test

📋 Current Configuration:
   SMTP_HOST: smtp.hostinger.com ✅
   SMTP_PORT: 587 ✅
   SMTP_USER: noreply@compucar.pro ✅
   SMTP_PASS: ✅ Set
   FROM_EMAIL: noreply@compucar.pro ✅
   FROM_NAME: CompuCar File Tuning ✅

🚀 Detected Email Service: SMTP (Nodemailer)

🔗 Testing SMTP Connection...
✅ SMTP connection successful!
```

### **Step 5: Test Email Sending**

Visit your email test page:
```
http://localhost:3000/email-test
```

Or test via API:
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-test-email@example.com",
    "subject": "CompuCar Email Test",
    "message": "This is a test email from your CompuCar website using Hostinger email service.",
    "html": "<h1>Email Test Successful!</h1><p>Your Hostinger email integration is working correctly.</p>"
  }'
```

## 🔧 Advanced Configuration

### **Email Account Recommendations**

For a professional setup, create these email accounts:

1. **noreply@compucar.pro** - System emails (file notifications, etc.)
2. **admin@compucar.pro** - Admin alerts and notifications
3. **support@compucar.pro** - Customer support emails
4. **info@compucar.pro** - General business inquiries
5. **billing@compucar.pro** - Payment and billing related emails

### **Email Forwarding Setup**

In Hostinger, you can set up email forwarding:
1. Go to **Email** → **Email Forwarding**
2. Forward all emails to your main business email
3. Example: Forward `support@compucar.pro` → `your-main-email@gmail.com`

### **Email Security Settings**

1. **Strong Passwords**: Use complex passwords for all email accounts
2. **Two-Factor Authentication**: Enable 2FA in Hostinger if available
3. **Regular Password Updates**: Change passwords every 3-6 months

## 📊 Email Limits and Quotas

### **Hostinger Email Limits**
- **Sending Limit**: Usually 100-300 emails per hour (depends on plan)
- **Storage**: Varies by hosting plan (typically 1-10GB per account)
- **Attachment Size**: Usually up to 25MB per email

### **Best Practices for High Volume**
If you need to send many emails:
1. **Batch Processing**: Send emails in batches
2. **Queue System**: Implement email queuing
3. **Monitor Limits**: Track your sending volume
4. **Upgrade Plan**: Consider higher-tier Hostinger plans for more limits

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. "Authentication Failed" Error**
```
Error: Invalid login: 535 Authentication failed
```
**Solutions:**
- ✅ Verify email account exists in Hostinger
- ✅ Check username is the full email address
- ✅ Confirm password is correct
- ✅ Try port 465 with SSL instead of 587

#### **2. "Connection Timeout" Error**
```
Error: connect ETIMEDOUT
```
**Solutions:**
- ✅ Check if your server can reach smtp.hostinger.com
- ✅ Verify firewall isn't blocking SMTP ports
- ✅ Try alternative port (465 instead of 587)
- ✅ Contact Hostinger support if issue persists

#### **3. "Emails Going to Spam"**
**Solutions:**
- ✅ Setup SPF record: `v=spf1 include:_spf.hostinger.com ~all`
- ✅ Add DKIM record (available in Hostinger email settings)
- ✅ Use professional email content
- ✅ Avoid spam trigger words

### **DNS Records for Better Deliverability**

Add these DNS records to your domain:

#### **SPF Record**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.hostinger.com ~all
```

#### **DMARC Record**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@compucar.pro
```

#### **DKIM Record**
- Available in Hostinger Email settings
- Copy the DKIM record provided by Hostinger
- Add it to your DNS settings

## 🚀 Production Deployment

### **Environment Variables for Production**

```env
# Production Hostinger Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@compucar.pro
SMTP_PASS=your-secure-production-password
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro
EMAIL_ENABLED=true

# Additional production settings
NODE_ENV=production
NEXTAUTH_URL=https://compucar.pro
```

### **Monitoring Email Performance**

1. **Check Email Logs**: Monitor your application logs for email errors
2. **Hostinger Email Stats**: Check email usage in Hostinger control panel
3. **Delivery Reports**: Monitor bounce rates and delivery success
4. **Customer Feedback**: Ask customers if they receive notifications

## ✅ Final Checklist

- [ ] Created email accounts in Hostinger (noreply, admin, support)
- [ ] Updated .env file with Hostinger SMTP settings
- [ ] Tested SMTP connection successfully
- [ ] Sent test emails and verified delivery
- [ ] Added SPF and DMARC DNS records
- [ ] Configured email forwarding if needed
- [ ] Tested all email templates (file notifications, welcome emails, etc.)
- [ ] Verified emails don't go to spam folder
- [ ] Documented email passwords securely
- [ ] Set up monitoring for email delivery

## 🔗 Useful Links

- **Hostinger Control Panel**: [hpanel.hostinger.com](https://hpanel.hostinger.com/)
- **Hostinger Email Guide**: [support.hostinger.com/en/articles/1583229-how-to-set-up-an-email-account](https://support.hostinger.com/en/articles/1583229-how-to-set-up-an-email-account)
- **SMTP Settings**: Available in your Hostinger email account settings
- **DNS Management**: Available in Hostinger control panel under "DNS Zone Editor"

---

**🎉 Your CompuCar website is now configured to use Hostinger email service!**

**📧 All system notifications, file updates, and customer communications will be sent through your professional compucar.pro email addresses.**
