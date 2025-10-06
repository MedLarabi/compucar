import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  html?: string; // Optional HTML content
}

// Create transporter based on environment
async function createTransporter() {
  // In development, use Ethereal Email (test email service)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧪 Development mode: Using Ethereal Email for testing');
    
    // Create test account automatically
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // In production, use real SMTP credentials from environment variables
  console.log('🚀 Production mode: Using real SMTP credentials');
  
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP configuration in environment variables');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: EmailRequest = await request.json();
    const { to, subject, message, html } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = await createTransporter();

    // Email configuration
    const fromEmail = process.env.FROM_EMAIL || 'noreply@compucar.com';
    const fromName = process.env.FROM_NAME || 'CompuCar';

    // Email options
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      text: message,
      ...(html && { html }), // Include HTML if provided
    };

    // Send email
    console.log(`📧 Sending email to: ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);

    // Return response based on environment
    if (process.env.NODE_ENV !== 'production') {
      // In development, return preview URL for Ethereal Email
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('🔗 Preview URL:', previewUrl);
      
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        message: 'Email sent successfully! Check the preview URL to see the email.',
      });
    } else {
      // In production, return simple success response
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully!',
      });
    }

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}

// GET method for API route testing
export async function GET() {
  return NextResponse.json({
    message: 'CompuCar Email API',
    status: 'ready',
    environment: process.env.NODE_ENV,
    endpoints: {
      POST: '/api/send-email - Send email with { to, subject, message, html? }',
    },
    notes: {
      development: 'Uses Ethereal Email for testing - returns preview URL',
      production: 'Uses SMTP credentials from environment variables',
      'HTML Support': 'Include html field for rich email content',
      'SMTP Migration': 'To switch SMTP providers, update SMTP_* env variables',
    },
  });
}

/*
📧 EMAIL SETUP NOTES:

🔧 SWITCHING TO REAL SMTP SERVICE:
1. Set environment variables in .env.local:
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=your_username
   SMTP_PASS=your_password

2. Popular SMTP Providers:
   - Resend: smtp.resend.com:587 (Recommended for developers)
   - SendGrid: smtp.sendgrid.net:587
   - Mailgun: smtp.mailgun.org:587
   - Gmail: smtp.gmail.com:587

🎨 ADDING HTML EMAIL SUPPORT:
Include 'html' field in request body:
{
  "to": "user@example.com",
  "subject": "Welcome to CompuCar!",
  "message": "Plain text version",
  "html": "<h1>Welcome!</h1><p>HTML version</p>"
}

🚀 PRODUCTION DEPLOYMENT:
1. Set all SMTP_* environment variables
2. Set FROM_EMAIL and FROM_NAME
3. Test email functionality before going live
4. Monitor email delivery and bounces

💡 USAGE EXAMPLES:
- Order confirmations
- Password reset emails
- Contact form submissions
- Newsletter subscriptions
- Account notifications
*/
