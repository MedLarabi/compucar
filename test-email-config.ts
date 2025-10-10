#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

async function testHostingerEmailConfig() {
  console.log('📧 CompuCar Hostinger Email Configuration Test\n');
  
  // Check environment variables
  console.log('📋 Current Configuration:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ Not set'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ Not set'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ Not set'}`);
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ Not set'}`);
  console.log(`   FROM_NAME: ${process.env.FROM_NAME || '❌ Not set'}`);
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || '❌ Not set'}`);
  console.log(`   EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || '❌ Not set'}`);
  
  console.log('\n🔍 Configuration Analysis:');
  
  // Check if Hostinger configuration is complete
  const isHostingerConfigured = 
    process.env.SMTP_HOST?.includes('hostinger') &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER?.includes('@compucar.pro') &&
    process.env.SMTP_PASS &&
    process.env.FROM_EMAIL?.includes('@compucar.pro');
  
  if (isHostingerConfigured) {
    console.log('✅ Hostinger email configuration detected');
    console.log(`   Using: ${process.env.SMTP_USER} via ${process.env.SMTP_HOST}`);
  } else {
    console.log('⚠️  Hostinger email not fully configured');
    
    const issues = [];
    if (!process.env.SMTP_HOST?.includes('hostinger')) {
      issues.push('SMTP_HOST should be smtp.hostinger.com');
    }
    if (!process.env.SMTP_PORT || !['587', '465'].includes(process.env.SMTP_PORT)) {
      issues.push('SMTP_PORT should be 587 or 465');
    }
    if (!process.env.SMTP_USER?.includes('@compucar.pro')) {
      issues.push('SMTP_USER should be your Hostinger email (e.g., noreply@compucar.pro)');
    }
    if (!process.env.SMTP_PASS) {
      issues.push('SMTP_PASS is required (your Hostinger email password)');
    }
    if (!process.env.FROM_EMAIL?.includes('@compucar.pro')) {
      issues.push('FROM_EMAIL should use compucar.pro domain');
    }
    
    console.log('\n❌ Configuration Issues:');
    issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  // Test SMTP connection if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('\n🔗 Testing SMTP Connection...');
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.verify();
      console.log('✅ SMTP connection successful!');
      
      // Test sending an email
      console.log('\n📤 Sending test email...');
      const testEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'CompuCar'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: testEmail,
        subject: '🧪 CompuCar Hostinger Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🎉 Email Test Successful!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Congratulations! Your CompuCar website is now successfully configured to send emails using Hostinger.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">📧 Configuration Details:</h3>
                <p style="margin: 5px 0;"><strong>SMTP Server:</strong> ${process.env.SMTP_HOST}</p>
                <p style="margin: 5px 0;"><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
                <p style="margin: 5px 0;"><strong>From Email:</strong> ${process.env.FROM_EMAIL}</p>
                <p style="margin: 5px 0;"><strong>Security:</strong> ${process.env.SMTP_PORT === '465' ? 'SSL/TLS' : 'STARTTLS'}</p>
              </div>
              <p style="color: #10b981;"><strong>✅ Your email system is ready for production!</strong></p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
              <p>CompuCar File Tuning System | Test sent at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `,
        text: `
CompuCar Email Test Successful!

Your Hostinger email configuration is working correctly.

Configuration:
- SMTP Server: ${process.env.SMTP_HOST}
- Port: ${process.env.SMTP_PORT}  
- From: ${process.env.FROM_EMAIL}

Test sent at: ${new Date().toLocaleString()}
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent successfully to: ${testEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.log('❌ SMTP connection/email failed:', error instanceof Error ? error.message : String(error));
      
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   • Verify your Hostinger email account exists');
      console.log('   • Check email password is correct');
      console.log('   • Ensure email account is active in Hostinger');
      console.log('   • Try port 465 with SSL if 587 fails');
      console.log('   • Contact Hostinger support if issues persist');
    }
  }
  
  console.log('\n📚 Next Steps:');
  
  if (!isHostingerConfigured) {
    console.log('1. Create email accounts in Hostinger control panel');
    console.log('2. Update your .env file with correct Hostinger settings');
    console.log('3. Run this test again to verify configuration');
    console.log('4. See HOSTINGER_EMAIL_SETUP.md for detailed instructions');
  } else {
    console.log('1. Visit http://localhost:3000/email-test for more testing');
    console.log('2. Test file upload notifications');
    console.log('3. Check email delivery and spam folder');
    console.log('4. Monitor application logs for email sending');
  }
  
  console.log('\n✅ Email configuration test complete!');
}

// Run the test
testHostingerEmailConfig().catch(console.error);
