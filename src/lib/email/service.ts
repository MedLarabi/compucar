import nodemailer from 'nodemailer';

// Email configuration
const createTransporter = () => {
  // For development, use Ethereal Email (test email service)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('Using Ethereal Email for development');
    // Ethereal credentials will be generated automatically
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // For production, use provided SMTP settings
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'File Tuning System'} <${process.env.FROM_EMAIL || 'noreply@localhost'}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

    // For development with Ethereal, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email Templates
export const emailTemplates = {
  newFileUploaded: (data: {
    customerName: string;
    filename: string;
    modifications: string[];
    fileId: string;
    adminUrl: string;
  }) => ({
    subject: `New File Upload: ${data.filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New File Upload Received</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">File Details</h3>
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Filename:</strong> ${data.filename}</p>
          <p><strong>File ID:</strong> ${data.fileId}</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1976d2;">Requested Modifications</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${data.modifications.map(mod => `<li>${mod}</li>`).join('')}
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.adminUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Panel
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          This is an automated notification from the File Tuning System.
        </p>
      </div>
    `
  }),

  fileReady: (data: {
    customerName: string;
    filename: string;
    price?: number;
    downloadUrl: string;
  }) => ({
    subject: `Your File is Ready: ${data.filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Your File is Ready! 🎉</h2>
        
        <p>Hello ${data.customerName},</p>
        
        <p>Great news! Your file <strong>${data.filename}</strong> has been processed and is ready for download.</p>

        ${data.price ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="margin-top: 0; color: #856404;">Pricing Information</h3>
            <p style="margin: 0; font-size: 18px;"><strong>Total Cost: ${data.price.toFixed(0)} DA</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
              Payment is handled manually. Please contact us to arrange payment.
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Download Your File
          </a>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #495057;">Important Notes</h3>
          <ul style="margin: 0; padding-left: 20px; color: #6c757d;">
            <li>Download links expire after 15 minutes for security</li>
            <li>You can always get a new download link from your account</li>
            <li>Keep your files safe - we recommend backing them up</li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          Thank you for using our File Tuning Service!<br>
          If you have any questions, please don't hesitate to contact us.
        </p>
      </div>
    `
  }),

  priceSet: (data: {
    customerName: string;
    filename: string;
    price: number;
  }) => ({
    subject: `Price Set for Your File: ${data.filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Price Information</h2>
        
        <p>Hello ${data.customerName},</p>
        
        <p>We've set the price for your file <strong>${data.filename}</strong>.</p>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #1976d2;">Total Cost</h3>
          <p style="font-size: 24px; font-weight: bold; margin: 0; color: #1976d2;">${data.price.toFixed(0)} DA</p>
        </div>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Payment Instructions</h3>
          <p style="margin: 0; color: #856404;">
            Payment is handled manually. Please contact us to arrange payment. 
            Once payment is confirmed, you'll be able to download your processed file.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          Thank you for using our File Tuning Service!
        </p>
      </div>
    `
  }),

  paymentConfirmed: (data: {
    customerName: string;
    filename: string;
    price: number;
  }) => ({
    subject: `Payment Confirmed: ${data.filename}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Confirmed! ✅</h2>
        
        <p>Hello ${data.customerName},</p>
        
        <p>We've confirmed your payment for <strong>${data.filename}</strong>.</p>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #155724;">Payment Details</h3>
          <p style="margin: 0; color: #155724;">
            <strong>Amount Paid: ${data.price.toFixed(0)} DA</strong><br>
            <span style="font-size: 14px;">Payment Status: Confirmed</span>
          </p>
        </div>

        <p>Your file will be processed and you'll receive another notification when it's ready for download.</p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="color: #6c757d; font-size: 14px;">
          Thank you for your business!
        </p>
      </div>
    `
  })
};

// Notification service functions
export async function notifyAdminsNewFile(data: {
  customerName: string;
  filename: string;
  modifications: string[];
  fileId: string;
}) {
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || [];
  
  if (adminEmails.length === 0) {
    console.warn('No admin emails configured');
    return false;
  }

  const template = emailTemplates.newFileUploaded({
    ...data,
    adminUrl: `${process.env.NEXTAUTH_URL}/admin/files/${data.fileId}`
  });

  return await sendEmail({
    to: adminEmails,
    subject: template.subject,
    html: template.html
  });
}

export async function notifyCustomerFileReady(data: {
  customerEmail: string;
  customerName: string;
  filename: string;
  price?: number;
  fileId: string;
}) {
  const template = emailTemplates.fileReady({
    customerName: data.customerName,
    filename: data.filename,
    price: data.price,
    downloadUrl: `${process.env.NEXTAUTH_URL}/files/${data.fileId}`
  });

  return await sendEmail({
    to: data.customerEmail,
    subject: template.subject,
    html: template.html
  });
}

export async function notifyCustomerPriceSet(data: {
  customerEmail: string;
  customerName: string;
  filename: string;
  price: number;
}) {
  const template = emailTemplates.priceSet(data);

  return await sendEmail({
    to: data.customerEmail,
    subject: template.subject,
    html: template.html
  });
}

export async function notifyCustomerPaymentConfirmed(data: {
  customerEmail: string;
  customerName: string;
  filename: string;
  price: number;
}) {
  const template = emailTemplates.paymentConfirmed(data);

  return await sendEmail({
    to: data.customerEmail,
    subject: template.subject,
    html: template.html
  });
}
