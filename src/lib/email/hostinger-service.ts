import nodemailer from 'nodemailer';

// Hostinger-focused email service for CompuCar
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Main email service class
class CompuCarEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter() {
    // For development, use Ethereal Email (test email service)
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('📧 Using Ethereal Email for development');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    }

    // For production, use Hostinger SMTP settings
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      console.log(`📤 Sending email via SMTP:`, {
        to: options.to,
        subject: options.subject,
      });

      const mailOptions = {
        from: `${process.env.FROM_NAME || 'CompuCar'} <${process.env.FROM_EMAIL || 'noreply@compucar.pro'}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to: ${options.to}`, {
        messageId: info.messageId,
      });

      // For development with Ethereal, log the preview URL
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return false;
    }
  }

  async test(): Promise<boolean> {
    try {
      console.log('🔗 Testing SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP connection successful!');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      return 'Ethereal (Development)';
    }
    
    if (process.env.SMTP_HOST?.includes('hostinger')) {
      return 'Hostinger SMTP';
    }
    
    if (process.env.SMTP_HOST?.includes('gmail')) {
      return 'Gmail SMTP';
    }
    
    return 'SMTP';
  }
}

// Create singleton instance
const emailService = new CompuCarEmailService();

// Export functions for backward compatibility
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return await emailService.send(options);
}

export async function testEmailConnection(): Promise<boolean> {
  return await emailService.test();
}

export function getEmailProvider(): string {
  return emailService.getProviderName();
}

// Pre-built email templates for CompuCar
export const emailTemplates = {
  // File processing notifications
  fileReceived: (data: { customerName: string; fileName: string; fileId: string }) => ({
    subject: `📥 File Received: ${data.fileName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">📥 File Received</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi <strong>${data.customerName}</strong>,</p>
          
          <p>We've successfully received your file and it's now in our processing queue.</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">📄 File Details:</h3>
            <p style="margin: 5px 0;"><strong>File:</strong> ${data.fileName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> 📥 Received</p>
            <p style="margin: 5px 0;"><strong>Next:</strong> Our team will review and start processing</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://compucar.pro/files" 
               style="background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              📊 Track Your File
            </a>
          </div>
          
          <p>You'll receive another notification when processing begins and when your file is ready.</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>CompuCar File Tuning System | <a href="https://compucar.pro">compucar.pro</a></p>
        </div>
      </div>
    `
  }),

  fileReady: (data: { customerName: string; fileName: string; downloadUrl: string }) => ({
    subject: `✅ File Ready: ${data.fileName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🎉 File Ready!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi <strong>${data.customerName}</strong>,</p>
          
          <p>Great news! Your file has been successfully processed and is ready for download.</p>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 10px 0;">📄 File Details:</h3>
            <p style="margin: 5px 0;"><strong>File:</strong> ${data.fileName}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ✅ Ready for Download</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.downloadUrl}" 
               style="background: #10b981; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px;">
              📥 Download Your File
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Important:</strong> Download links expire after 7 days for security. 
            If you need a new link, please contact support.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>CompuCar File Tuning System | <a href="https://compucar.pro">compucar.pro</a></p>
        </div>
      </div>
    `
  }),

  welcomeEmail: (data: { firstName: string; email: string; loginUrl: string }) => ({
    subject: `🚀 Welcome to CompuCar File Tuning!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">🚀 Welcome to CompuCar!</h1>
        </div>
        
        <div style="padding: 30px;">
          <p>Hi <strong>${data.firstName}</strong>,</p>
          
          <p>Welcome to CompuCar File Tuning System! We're excited to have you on board.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">🎯 What you can do:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Upload ECU files for professional tuning</li>
              <li>Track processing status in real-time</li>
              <li>Download optimized files when ready</li>
              <li>Access your file history anytime</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px;">
              🔐 Access Your Account
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Your account email: <strong>${data.email}</strong><br>
            Need help? Contact our support team anytime.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>CompuCar File Tuning System | <a href="https://compucar.pro">compucar.pro</a></p>
        </div>
      </div>
    `
  }),

  passwordReset: (data: { firstName: string; resetUrl: string; expiresIn: string }) => ({
    subject: `🔐 Reset Your CompuCar Password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔐 Password Reset</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hi <strong>${data.firstName}</strong>,</p>
          
          <p>We received a request to reset your CompuCar account password.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #dc2626;"><strong>Security Notice:</strong> If you didn't request this reset, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background: #dc2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              🔐 Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            This link expires in <strong>${data.expiresIn}</strong> for security.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>CompuCar File Tuning System | <a href="https://compucar.pro">compucar.pro</a></p>
        </div>
      </div>
    `
  }),
};

// Utility functions
export async function sendWelcomeEmail(firstName: string, email: string, loginUrl: string = 'https://compucar.pro/auth/login'): Promise<boolean> {
  const template = emailTemplates.welcomeEmail({ firstName, email, loginUrl });
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendFileReceivedEmail(customerName: string, email: string, fileName: string, fileId: string): Promise<boolean> {
  const template = emailTemplates.fileReceived({ customerName, fileName, fileId });
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendFileReadyEmail(customerName: string, email: string, fileName: string, downloadUrl: string): Promise<boolean> {
  const template = emailTemplates.fileReady({ customerName, fileName, downloadUrl });
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPasswordResetEmail(firstName: string, email: string, resetUrl: string, expiresIn: string = '1 hour'): Promise<boolean> {
  const template = emailTemplates.passwordReset({ firstName, resetUrl, expiresIn });
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
}

export default emailService;
