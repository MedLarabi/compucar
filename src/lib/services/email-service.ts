// Simple email service for development/production
// In production, you would integrate with services like Resend, SendGrid, or Nodemailer

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Generate a random password
export function generateRandomPassword(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Email templates
export const EMAIL_TEMPLATES = {
  welcomeWithPassword: (firstName: string, email: string, password: string) => ({
    subject: 'Welcome to CompuCar - Your Account is Ready!',
    text: `Welcome to CompuCar, ${firstName}!

Your account has been created successfully. Here are your login details:

Email: ${email}
Password: ${password}

You can now log in to your account at any time to:
- View your order history
- Track your orders
- Manage your account settings
- Enjoy faster checkout

We recommend changing your password after your first login for security.

Thank you for choosing CompuCar!

Best regards,
The CompuCar Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome to CompuCar!</h1>
        
        <p>Hello ${firstName},</p>
        
        <p>Your account has been created successfully. Here are your login details:</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> <code style="background: #e0e0e0; padding: 2px 5px; border-radius: 3px;">${password}</code></p>
        </div>
        
        <p>You can now log in to your account to:</p>
        <ul>
          <li>View your order history</li>
          <li>Track your orders</li>
          <li>Manage your account settings</li>
          <li>Enjoy faster checkout</li>
        </ul>
        
        <p><strong>Security tip:</strong> We recommend changing your password after your first login.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Account
          </a>
        </div>
        
        <p>Thank you for choosing CompuCar!</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This email was sent because an account was created for you at CompuCar.<br>
          If you didn't request this, please contact our support team.
        </p>
      </div>
    `
  })
};

// Mock email sending function for development
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In development, log the email to console
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL SENT (Development Mode):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Text:', options.text);
      console.log('HTML:', options.html ? 'HTML content included' : 'No HTML');
      console.log('---');
      return true;
    }

    // In production, you would integrate with a real email service
    // Example with different services:
    
    // Resend example:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@compucar.com',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html || options.text,
    // });

    // SendGrid example:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: options.to,
    //   from: 'noreply@compucar.com',
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    // });

    // Nodemailer example:
    // const transporter = nodemailer.createTransporter({ ... });
    // await transporter.sendMail({
    //   from: 'noreply@compucar.com',
    //   to: options.to,
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    // });

    // For now, just log and return success
    console.log(`📧 Email would be sent to: ${options.to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(firstName: string, email: string, password: string): Promise<boolean> {
  const template = EMAIL_TEMPLATES.welcomeWithPassword(firstName, email, password);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

