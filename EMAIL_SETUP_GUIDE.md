# 📧 CompuCar Email Setup Guide

## 📋 Table of Contents
1. [Current Email Setup](#current-email-setup)
2. [Email Service Options](#email-service-options)
3. [Setup Instructions](#setup-instructions)
4. [Configuration Examples](#configuration-examples)
5. [Email Templates](#email-templates)
6. [Testing Email Setup](#testing-email-setup)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🔍 Current Email Setup

Your CompuCar website already has a **comprehensive email infrastructure** in place:

### ✅ **What's Already Implemented:**
- **Nodemailer** integration for SMTP email sending
- **Multiple email services** (3 different implementations)
- **Email templates** for various notifications
- **Development testing** with Ethereal Email
- **Production-ready** SMTP configuration
- **Email API endpoint** (`/api/send-email`)
- **Notification system** integration

### 📁 **Key Files:**
- `/src/lib/email/service.ts` - Main email service (Nodemailer)
- `/src/lib/services/email-service.ts` - Alternative email service
- `/src/app/api/send-email/route.ts` - Email API endpoint  
- `/src/lib/email-templates.ts` - Email templates
- `/src/app/email-test/page.tsx` - Email testing page

---

## 🚀 Email Service Options

### **Option 1: Gmail SMTP (Recommended for Small Scale)**
- ✅ **Free** up to 500 emails/day
- ✅ **Easy setup** with app passwords
- ✅ **Reliable** delivery
- ❌ **Limited** sending volume

### **Option 2: Resend (Recommended for Production)**
- ✅ **Developer-friendly** with great API
- ✅ **High deliverability** rates
- ✅ **Free tier**: 3,000 emails/month
- ✅ **Simple integration**

### **Option 3: SendGrid**
- ✅ **Enterprise-grade** reliability
- ✅ **Advanced analytics**
- ✅ **Free tier**: 100 emails/day
- ❌ **More complex** setup

### **Option 4: Hostinger Email (Recommended for CompuCar)**
- ✅ **Professional email** with your domain
- ✅ **Reliable SMTP** service
- ✅ **Good deliverability** rates
- ✅ **Affordable pricing**
- ✅ **Easy integration** with your website

### **Option 5: Custom SMTP**
- ✅ **Full control** over email server
- ✅ **No third-party** dependencies
- ❌ **Complex setup** and maintenance
- ❌ **Deliverability challenges**

---

## ⚙️ Setup Instructions

### **1. Gmail SMTP Setup (Quick Start)**

#### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → Turn On

#### **Step 2: Generate App Password**
1. Google Account → Security → App passwords
2. Select app: "Mail"
3. Select device: "Other" → Enter "CompuCar Website"
4. **Copy the 16-character password**

#### **Step 3: Update Environment Variables**
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_NAME=CompuCar
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=your-email@gmail.com
```

### **2. Resend Setup (Production Recommended)**

#### **Step 1: Create Resend Account**
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account

#### **Step 2: Add Domain**
1. Dashboard → Domains → Add Domain
2. Enter: `compucar.pro`
3. Add DNS records to your domain:
   ```
   TXT: resend._domainkey IN TXT "your-dkim-key"
   ```

#### **Step 3: Get API Key**
1. Dashboard → API Keys → Create API Key
2. Name: "CompuCar Production"
3. **Copy the API key**

#### **Step 4: Install Resend Package**
```bash
npm install resend
```

#### **Step 5: Update Environment Variables**
```env
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro
```

### **4. Hostinger Email Setup (Recommended for CompuCar)**

#### **Step 1: Create Email Account in Hostinger**
1. Log in to your [Hostinger Control Panel](https://hpanel.hostinger.com/)
2. Go to **Email** → **Email Accounts**
3. Click **Create Email Account**
4. Create accounts:
   - `noreply@compucar.pro` (for system emails)
   - `admin@compucar.pro` (for admin notifications)
   - `support@compucar.pro` (for customer support)

#### **Step 2: Get SMTP Settings**
Hostinger SMTP settings for `compucar.pro`:
```
SMTP Server: smtp.hostinger.com
SMTP Port: 587 (recommended) or 465 (SSL)
Security: STARTTLS (port 587) or SSL/TLS (port 465)
Authentication: Yes
```

#### **Step 3: Update Environment Variables**
```env
# Hostinger Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@compucar.pro
SMTP_PASS=your-email-password
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro

# Enable email notifications
EMAIL_ENABLED=true
```

#### **Step 4: Test Email Configuration**
```bash
# Test your Hostinger email setup
npx tsx test-email-config.ts
```

### **5. SendGrid Setup**

#### **Step 1: Create SendGrid Account**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your account

#### **Step 2: Domain Authentication**
1. Settings → Sender Authentication → Domain Authentication
2. Add domain: `compucar.pro`
3. Add DNS records provided by SendGrid

#### **Step 3: Create API Key**
1. Settings → API Keys → Create API Key
2. Full Access or Restricted Access
3. **Copy the API key**

#### **Step 4: Install SendGrid Package**
```bash
npm install @sendgrid/mail
```

#### **Step 5: Update Environment Variables**
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro
```

---

## 📝 Configuration Examples

### **Hostinger Email Configuration (.env)**
```env
# Hostinger Email Configuration for CompuCar
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@compucar.pro
SMTP_PASS=your-secure-email-password
FROM_NAME=CompuCar File Tuning
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro

# Enable email notifications
EMAIL_ENABLED=true

# Optional: Backup admin email
BACKUP_ADMIN_EMAIL=support@compucar.pro
```

### **Gmail SMTP (.env)**
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=compucar.business@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
FROM_NAME=CompuCar File Tuning
FROM_EMAIL=compucar.business@gmail.com
ADMIN_EMAIL=compucar.business@gmail.com

# Enable email notifications
EMAIL_ENABLED=true
```

### **Resend Configuration (.env)**
```env
# Resend Configuration
RESEND_API_KEY=re_123abc456def789ghi
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro

# Disable SMTP (using Resend API instead)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Enable email notifications
EMAIL_ENABLED=true
```

### **Custom Domain Setup**
```env
# Custom SMTP Server
SMTP_HOST=mail.compucar.pro
SMTP_PORT=587
SMTP_USER=noreply@compucar.pro
SMTP_PASS=your-secure-password
FROM_NAME=CompuCar
FROM_EMAIL=noreply@compucar.pro
ADMIN_EMAIL=admin@compucar.pro
```

---

## 📧 Email Templates

Your website already includes these email templates:

### **1. File Upload Notifications**
- New file uploaded
- File status updates (RECEIVED → PENDING → READY)
- Processing time estimates
- File ready for download

### **2. User Account Emails**
- Welcome email
- Password reset
- Account verification
- Security alerts

### **3. Order & Payment Emails**
- Order confirmation
- Payment receipts
- Shipping notifications
- Delivery confirmations

### **4. System Notifications**
- Admin alerts
- Error notifications
- System status updates

### **Custom Email Template Example:**
```typescript
// Add to src/lib/email-templates.ts
export const customEmailTemplate = {
  fileProcessingComplete: (data: { 
    customerName: string; 
    fileName: string; 
    downloadUrl: string; 
  }) => ({
    subject: `✅ Your file ${data.fileName} is ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎉 File Processing Complete!</h2>
        
        <p>Hi <strong>${data.customerName}</strong>,</p>
        
        <p>Great news! Your file <strong>${data.fileName}</strong> has been successfully processed and is ready for download.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">📄 File Details:</h3>
          <p style="margin: 5px 0;"><strong>File:</strong> ${data.fileName}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ✅ Ready for Download</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            📥 Download Your File
          </a>
        </div>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="font-size: 12px; color: #6b7280;">
          This email was sent by CompuCar File Tuning System<br>
          <a href="https://compucar.pro">compucar.pro</a>
        </p>
      </div>
    `
  })
};
```

---

## 🧪 Testing Email Setup

### **1. Development Testing (Ethereal Email)**
Your setup automatically uses **Ethereal Email** for development:

```bash
# Start development server
npm run dev

# Visit the email test page
http://localhost:3000/email-test
```

**Ethereal Email Features:**
- ✅ **No real emails sent** during development
- ✅ **Preview URLs** in console logs
- ✅ **Test all email templates** safely

### **2. Production Testing**

#### **Test Email API Endpoint:**
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from CompuCar",
    "html": "<h1>Test Email</h1><p>This is a test email from CompuCar</p>"
  }'
```

#### **Test Email Service Directly:**
```typescript
// Create test file: test-email.ts
import { sendEmail } from './src/lib/email/service';

async function testEmail() {
  const result = await sendEmail({
    to: 'your-email@example.com',
    subject: '🧪 CompuCar Email Test',
    html: `
      <h1>Email Test Successful!</h1>
      <p>Your CompuCar email system is working correctly.</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `
  });
  
  console.log('Email sent:', result);
}

testEmail();
```

```bash
# Run the test
npx tsx test-email.ts
```

### **3. Email Testing Checklist**

- [ ] **SMTP Connection** - Can connect to email server
- [ ] **Authentication** - Credentials work correctly
- [ ] **Email Sending** - Emails are sent successfully
- [ ] **Email Delivery** - Emails reach inbox (not spam)
- [ ] **Template Rendering** - HTML templates display correctly
- [ ] **Links Work** - All links in emails are functional
- [ ] **Mobile Responsive** - Emails look good on mobile devices

---

## 🚀 Production Deployment

### **1. Environment Variables Setup**

#### **For VPS/Server Deployment:**
```bash
# Create production .env file
nano .env

# Add your production email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-app-password
FROM_NAME=CompuCar
FROM_EMAIL=your-production-email@gmail.com
ADMIN_EMAIL=admin@compucar.pro
EMAIL_ENABLED=true
```

#### **For Vercel Deployment:**
```bash
# Set environment variables via Vercel CLI
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add FROM_NAME
vercel env add FROM_EMAIL
vercel env add ADMIN_EMAIL
vercel env add EMAIL_ENABLED
```

### **2. DNS Configuration**

#### **SPF Record** (Prevent spoofing):
```
TXT: @ IN TXT "v=spf1 include:_spf.google.com ~all"
```

#### **DKIM Record** (Email authentication):
```
TXT: google._domainkey IN TXT "v=DKIM1; k=rsa; p=your-public-key"
```

#### **DMARC Record** (Email policy):
```
TXT: _dmarc IN TXT "v=DMARC1; p=quarantine; rua=mailto:admin@compucar.pro"
```

### **3. Email Deliverability Tips**

1. **Use Custom Domain**: `noreply@compucar.pro` instead of `gmail.com`
2. **Warm Up Email**: Start with low volume, gradually increase
3. **Monitor Bounce Rates**: Keep bounce rate below 5%
4. **Avoid Spam Words**: Don't use "FREE", "URGENT", etc.
5. **Include Unsubscribe**: Always provide unsubscribe link
6. **Test Spam Score**: Use tools like Mail Tester

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. "Authentication Failed" Error**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions:**
- ✅ Enable 2-Factor Authentication on Gmail
- ✅ Use App Password, not regular password
- ✅ Check SMTP_USER matches the email account
- ✅ Verify SMTP_HOST and SMTP_PORT are correct

#### **2. "Connection Timeout" Error**
```
Error: connect ETIMEDOUT
```

**Solutions:**
- ✅ Check firewall settings
- ✅ Verify SMTP_HOST is reachable
- ✅ Try different SMTP_PORT (587, 465, 25)
- ✅ Check if ISP blocks SMTP ports

#### **3. "Emails Going to Spam"**
**Solutions:**
- ✅ Setup SPF, DKIM, DMARC records
- ✅ Use custom domain instead of Gmail
- ✅ Avoid spam trigger words
- ✅ Include plain text version
- ✅ Maintain good sender reputation

#### **4. "Rate Limiting" Error**
```
Error: 550 Daily sending quota exceeded
```

**Solutions:**
- ✅ Upgrade to paid email service
- ✅ Implement email queue system
- ✅ Reduce email frequency
- ✅ Use multiple SMTP servers

#### **5. "Template Not Rendering"**
**Solutions:**
- ✅ Check HTML syntax
- ✅ Use inline CSS styles
- ✅ Test with email clients
- ✅ Provide fallback text version

### **Debug Email Issues**

#### **Enable Debug Logging:**
```typescript
// Add to your email service
const transporter = nodemailer.createTransporter({
  // ... your config
  debug: true, // Enable debug output
  logger: true // Log to console
});
```

#### **Test SMTP Connection:**
```typescript
// Create test-smtp.ts
import nodemailer from 'nodemailer';

async function testSMTP() {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
  }
}

testSMTP();
```

---

## 📊 Email Analytics & Monitoring

### **1. Track Email Performance**
```typescript
// Add to your email service
export async function sendEmailWithTracking(options: EmailOptions) {
  const result = await sendEmail(options);
  
  // Log email metrics
  await prisma.emailLog.create({
    data: {
      to: options.to,
      subject: options.subject,
      status: result ? 'sent' : 'failed',
      sentAt: new Date(),
      provider: 'gmail' // or your provider
    }
  });
  
  return result;
}
```

### **2. Email Queue System**
```typescript
// For high-volume email sending
import Bull from 'bull';

const emailQueue = new Bull('email queue');

emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  return await sendEmail({ to, subject, html });
});

// Add emails to queue
export async function queueEmail(emailData: EmailOptions) {
  await emailQueue.add(emailData, {
    delay: 1000, // 1 second delay
    attempts: 3,  // Retry 3 times
  });
}
```

---

## 🎯 Quick Start Checklist

### **For Immediate Setup (Gmail):**
- [ ] 1. Enable 2FA on your Gmail account
- [ ] 2. Generate App Password
- [ ] 3. Update `.env` with Gmail SMTP settings
- [ ] 4. Test email sending via `/email-test` page
- [ ] 5. Verify emails reach inbox

### **For Production Setup (Resend):**
- [ ] 1. Create Resend account
- [ ] 2. Add and verify `compucar.pro` domain
- [ ] 3. Install Resend package: `npm install resend`
- [ ] 4. Update email service to use Resend API
- [ ] 5. Deploy with production environment variables

### **For Custom Domain:**
- [ ] 1. Setup email hosting (Google Workspace, etc.)
- [ ] 2. Configure DNS records (SPF, DKIM, DMARC)
- [ ] 3. Update SMTP settings
- [ ] 4. Test deliverability
- [ ] 5. Monitor email reputation

---

## 🔗 Useful Resources

- **Gmail SMTP**: [Google Support](https://support.google.com/mail/answer/7126229)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **SendGrid Docs**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **Email Testing**: [mail-tester.com](https://www.mail-tester.com)
- **DNS Checker**: [mxtoolbox.com](https://mxtoolbox.com)
- **DMARC Analyzer**: [dmarc.org](https://dmarc.org)

---

**✅ Your CompuCar email system is ready to go! Choose your preferred email service and follow the setup instructions above.**

**🚀 Need help? The email infrastructure is already built - you just need to configure your preferred email provider!**
