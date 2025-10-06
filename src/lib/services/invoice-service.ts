import { InvoiceData } from '@/components/invoice/invoice-template';

// Generate invoice data from order information
export function createInvoiceData(orderData: {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  customerNotes?: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    name: string;
    product: {
      name: string;
      isVirtual?: boolean;
    };
  }>;
  payments?: Array<{
    method: string;
    status: string;
    transactionId?: string;
    amount: number;
  }>;
}): InvoiceData {
  
  // Get customer name from user or from customer notes
  const firstName = orderData.user?.firstName || '';
  const lastName = orderData.user?.lastName || '';
  let customerName = `${firstName} ${lastName}`.trim();
  const customerEmail = orderData.user?.email || '';

  // If we don't have user data, try to extract from customer notes
  if (!customerName && orderData.customerNotes) {
    const match = orderData.customerNotes.match(/Customer: (.+?) \(/);
    if (match) {
      customerName = match[1];
    }
  }
  
  if (!customerName) {
    customerName = 'Guest Customer';
  }

  // Use actual order totals
  const subtotal = orderData.subtotal;
  const tax = orderData.tax;
  const shipping = orderData.shipping;
  const total = orderData.total;

  // Map order items to invoice items
  const invoiceItems = orderData.items.map(item => ({
    id: item.id,
    name: item.name || item.product.name,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: item.price * item.quantity,
    isVirtual: item.product.isVirtual || false
  }));

  // Determine payment status and method
  let paymentStatus: 'paid' | 'pending' | 'failed' = 'pending';
  let paymentMethod = 'Unknown';
  let transactionId: string | undefined;

  // Check payment information
  if (orderData.payments && orderData.payments.length > 0) {
    const payment = orderData.payments[0]; // Use the first payment
    paymentMethod = payment.method;
    transactionId = payment.transactionId;
    
    if (payment.status === 'SUCCEEDED') {
      paymentStatus = 'paid';
    } else if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      paymentStatus = 'failed';
    }
  } else {
    // Fallback to order status
    if (orderData.status === 'DELIVERED' || orderData.status === 'PROCESSING') {
      paymentStatus = 'paid';
    } else if (orderData.status === 'CANCELLED') {
      paymentStatus = 'failed';
    }
  }

  return {
    invoiceNumber: orderData.orderNumber, // Use same ID as order
    orderNumber: orderData.orderNumber,
    invoiceDate: new Date().toISOString(),
    orderDate: orderData.createdAt,
    
    customer: {
      name: customerName,
      email: customerEmail,
      // You can add billing address here if you collect it
      billingAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    
    items: invoiceItems,
    
    payment: {
      method: paymentMethod,
      status: paymentStatus,
      transactionId: transactionId,
      subtotal: subtotal,
      tax: tax,
      total: total
    }
  };
}

// Utility function to format invoice data for email
export function formatInvoiceForEmail(invoiceData: InvoiceData): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = `Invoice ${invoiceData.invoiceNumber} - Your Order Confirmation`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Thank you for your purchase!</h2>
      <p>Dear ${invoiceData.customer.name},</p>
      <p>Your order has been processed successfully. Please find your invoice details below:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Order Summary</h3>
        <p><strong>Order Number:</strong> ${invoiceData.orderNumber}</p>
        <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(invoiceData.orderDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> $${invoiceData.payment.total.toFixed(2)}</p>
        <p><strong>Payment Status:</strong> ${invoiceData.payment.status.toUpperCase()}</p>
      </div>
      
      <h3>Items Purchased:</h3>
      <ul>
        ${invoiceData.items.map(item => `
          <li>${item.name} - Qty: ${item.quantity} - $${item.totalPrice.toFixed(2)}</li>
        `).join('')}
      </ul>
      
      <p>You can view and download your complete invoice by logging into your account.</p>
      
      <p>If you have any questions, please don't hesitate to contact our support team at support@compucar.com</p>
      
      <p>Best regards,<br>The CompuCar Team</p>
    </div>
  `;
  
  const textContent = `
    Thank you for your purchase!
    
    Dear ${invoiceData.customer.name},
    
    Your order has been processed successfully. Here are your order details:
    
    Order Number: ${invoiceData.orderNumber}
    Invoice Number: ${invoiceData.invoiceNumber}
    Order Date: ${new Date(invoiceData.orderDate).toLocaleDateString()}
    Total Amount: $${invoiceData.payment.total.toFixed(2)}
    Payment Status: ${invoiceData.payment.status.toUpperCase()}
    
    Items Purchased:
    ${invoiceData.items.map(item => `- ${item.name} - Qty: ${item.quantity} - $${item.totalPrice.toFixed(2)}`).join('\n')}
    
    You can view and download your complete invoice by logging into your account.
    
    If you have any questions, please contact our support team at support@compucar.com
    
    Best regards,
    The CompuCar Team
  `;
  
  return {
    subject,
    htmlContent,
    textContent
  };
}
