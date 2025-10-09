// Email templates for CompuCar e-commerce platform

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface PasswordResetData {
  name: string;
  resetLink: string;
  expiresIn: string;
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData) {
  const { orderNumber, customerName, items, subtotal, shipping, tax, total, shippingAddress, estimatedDelivery } = data;

  const plainText = `
Order Confirmation - CompuCar

Hi ${customerName},

Thank you for your order! We've received your order #${orderNumber} and are preparing it for shipment.

Order Details:
${items.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`).join('\n')}

Order Summary:
Subtotal: $${subtotal.toFixed(2)}
Shipping: $${shipping.toFixed(2)}
Tax: $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

Shipping Address:
${shippingAddress.name}
${shippingAddress.address}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}
${shippingAddress.country}

${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery}` : ''}

You can track your order status in your account dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/account/orders

Thank you for choosing CompuCar!

Best regards,
The CompuCar Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🚗 CompuCar</h1>
        <h2 style="color: #374151; margin: 10px 0;">Order Confirmation</h2>
        <p style="color: #6b7280; margin: 0;">Order #${orderNumber}</p>
      </header>

      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #374151; margin-top: 0;">Hi ${customerName}! 👋</h3>
        <p style="color: #6b7280; margin-bottom: 0;">
          Thank you for your order! We've received your order and are preparing it for shipment.
        </p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Items</h3>
        ${items.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f3f4f6;">
            <div>
              <h4 style="margin: 0; color: #374151;">${item.name}</h4>
              <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-weight: bold; color: #374151;">$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="color: #374151; margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280;">Subtotal:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280;">Shipping:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">$${shipping.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 8px 0; color: #6b7280;">Tax:</td>
            <td style="padding: 8px 0; text-align: right; color: #374151;">$${tax.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 15px 0 8px; font-weight: bold; color: #374151; font-size: 18px;">Total:</td>
            <td style="padding: 15px 0 8px; text-align: right; font-weight: bold; color: #2563eb; font-size: 18px;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #374151; margin-top: 0;">Shipping Address</h3>
        <address style="color: #6b7280; font-style: normal; line-height: 1.6;">
          ${shippingAddress.name}<br>
          ${shippingAddress.address}<br>
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
          ${shippingAddress.country}
        </address>
        ${estimatedDelivery ? `
          <div style="margin-top: 15px; padding: 10px; background: #dbeafe; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af; font-weight: bold;">📦 Estimated Delivery: ${estimatedDelivery}</p>
          </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/account/orders" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold;">
          Track Your Order
        </a>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <footer style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>Thank you for choosing CompuCar!</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}" style="color: #2563eb;">Visit our website</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/contact" style="color: #2563eb;">Contact Support</a>
        </p>
        <p>© 2024 CompuCar. All rights reserved.</p>
      </footer>
    </div>
  `;

  return { plainText, html };
}

export function generateWelcomeEmail(data: WelcomeEmailData) {
  const { name, email } = data;

  const plainText = `
Welcome to CompuCar, ${name}!

Thank you for creating your account with CompuCar. We're excited to have you as part of our automotive community!

Here's what you can do with your new account:
- Browse our extensive catalog of automotive parts and accessories
- Save products to your wishlist for later
- Track your orders and download invoices
- Manage your shipping addresses
- Access exclusive member deals and promotions

Get started by exploring our products: ${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/products

If you have any questions, our support team is here to help: ${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/contact

Happy shopping!

The CompuCar Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🚗 Welcome to CompuCar!</h1>
      </header>

      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 30px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
        <h2 style="color: #1e40af; margin: 0 0 10px;">Hi ${name}! 👋</h2>
        <p style="color: #3730a3; margin: 0; font-size: 16px;">
          Thank you for creating your account with CompuCar.<br>
          We're excited to have you as part of our automotive community!
        </p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #374151;">🔧 What you can do with your account:</h3>
        <ul style="color: #6b7280; line-height: 1.8;">
          <li>🛒 Browse our extensive catalog of automotive parts and accessories</li>
          <li>❤️ Save products to your wishlist for later</li>
          <li>📦 Track your orders and download invoices</li>
          <li>📍 Manage your shipping addresses</li>
          <li>🎯 Access exclusive member deals and promotions</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/products" 
           style="display: inline-block; background: #2563eb; color: white; padding: 15px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px 10px;">
          🛍️ Start Shopping
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/account" 
           style="display: inline-block; background: #6b7280; color: white; padding: 15px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px 10px;">
          👤 View Account
        </a>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0;">
        <h3 style="color: #374151; margin-top: 0;">🆘 Need Help?</h3>
        <p style="color: #6b7280; margin-bottom: 15px;">
          Our support team is here to help with any questions you might have.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/contact" 
           style="color: #2563eb; text-decoration: none; font-weight: bold;">
          Contact Support →
        </a>
      </div>

      <footer style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px;">
        <p>Happy shopping!</p>
        <p style="margin: 10px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}" style="color: #2563eb;">CompuCar.com</a>
        </p>
        <p>© 2024 CompuCar. All rights reserved.</p>
      </footer>
    </div>
  `;

  return { plainText, html };
}

export function generatePasswordResetEmail(data: PasswordResetData) {
  const { name, resetLink, expiresIn } = data;

  const plainText = `
Password Reset Request - CompuCar

Hi ${name},

We received a request to reset your password for your CompuCar account.

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiresIn}.

If you didn't request this password reset, please ignore this email or contact our support team.

For security reasons, please don't share this link with anyone.

Best regards,
The CompuCar Security Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🚗 CompuCar</h1>
        <h2 style="color: #374151; margin: 10px 0;">Password Reset Request</h2>
      </header>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #92400e; margin-top: 0;">🔐 Security Notice</h3>
        <p style="color: #92400e; margin-bottom: 0;">
          We received a request to reset your password for your CompuCar account.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #374151; margin-top: 0;">Hi ${name}!</h3>
        <p style="color: #6b7280;">
          Click the button below to reset your password. This link will expire in ${expiresIn}.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold;">
          🔑 Reset Password
        </a>
      </div>

      <div style="background: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>⚠️ Security Tips:</strong><br>
          • If you didn't request this reset, please ignore this email<br>
          • Don't share this link with anyone<br>
          • Contact support if you have concerns: 
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/contact" style="color: #dc2626;">Contact Us</a>
        </p>
      </div>

      <footer style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px;">
        <p>This link will expire in ${expiresIn}</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}" style="color: #2563eb;">CompuCar.com</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compucar.pro'}/contact" style="color: #2563eb;">Support</a>
        </p>
        <p>© 2024 CompuCar Security Team. All rights reserved.</p>
      </footer>
    </div>
  `;

  return { plainText, html };
}

// Utility function to send emails using the API
export async function sendEmail(params: {
  to: string;
  subject: string;
  message: string;
  html?: string;
}) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}
