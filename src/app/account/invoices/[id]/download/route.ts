import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/database/prisma';
import { createInvoiceData } from '@/lib/services/invoice-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    
    // Fetch the order with all related data
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id, // Ensure user owns this order
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isVirtual: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        payments: {
          select: {
            id: true,
            method: true,
            status: true,
            transactionId: true,
            amount: true,
            paidAt: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Convert order to invoice data
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      discount: Number(order.discount),
      user: order.user ? {
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
      } : undefined,
      customerNotes: order.customerNotes || undefined,
      items: order.items.map((item: any) => ({
        ...item,
        price: Number(item.price),
      })),
      payments: order.payments.map((payment: any) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    };

    const invoiceData = createInvoiceData(orderData);

    // Create HTML content for the invoice
    const htmlContent = generateInvoiceHTML(invoiceData);

    // For now, return the HTML content that can be saved as PDF by the browser
    // In production, you might want to use a PDF generation library like Puppeteer
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(invoiceData: any): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'background-color: #dcfce7; color: #166534; border-color: #bbf7d0;';
      case 'pending':
        return 'background-color: #fef3c7; color: #92400e; border-color: #fde68a;';
      case 'failed':
        return 'background-color: #fecaca; color: #991b1b; border-color: #fca5a5;';
      default:
        return 'background-color: #f3f4f6; color: #374151; border-color: #d1d5db;';
    }
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceData.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Inter', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1f2937;
            background-color: #ffffff;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
        }
        .company-info {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .company-logo {
            width: 64px;
            height: 64px;
            background-color: #2563eb;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .company-tagline {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h1 {
            font-size: 36px;
            font-weight: bold;
            margin: 0 0 16px 0;
        }
        .invoice-details {
            font-size: 14px;
        }
        .invoice-details div {
            display: flex;
            justify-content: space-between;
            width: 200px;
            margin-bottom: 4px;
        }
        .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .customer-info {
            font-size: 14px;
            line-height: 1.5;
        }
        .table-container {
            margin-bottom: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        th {
            background-color: #f9fafb;
            padding: 12px 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        th:last-child,
        td:last-child {
            text-align: right;
        }
        td {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .digital-badge {
            background-color: #dbeafe;
            color: #1e40af;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 24px;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table div {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .totals-separator {
            border-top: 1px solid #e5e7eb;
            margin: 8px 0;
        }
        .total-row {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
        }
        .payment-confirmation {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 40px;
        }
        .payment-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 24px;
            margin-top: 40px;
        }
        .footer-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 24px;
        }
        .footer-section h4 {
            font-weight: 600;
            margin-bottom: 8px;
        }
        .footer-section div {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
        }
        .legal-notice {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
            border-top: 1px solid #f3f4f6;
            padding-top: 16px;
        }
        @media print {
            body { margin: 0; padding: 10mm; }
            .invoice-container { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-logo">CC</div>
                <div>
                    <h1 class="company-name">CompuCar</h1>
                    <p class="company-tagline">Digital Products & Solutions</p>
                </div>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-details">
                    <div><span>Invoice #:</span><span>${invoiceData.invoiceNumber}</span></div>
                    <div><span>Order #:</span><span>${invoiceData.orderNumber}</span></div>
                    <div><span>Invoice Date:</span><span>${formatDate(invoiceData.invoiceDate)}</span></div>
                </div>
            </div>
        </div>

        <!-- Customer Information -->
        <div class="customer-section">
            <div>
                <h3 class="section-title">Bill To</h3>
                <div class="customer-info">
                    <p><strong>${invoiceData.customer.name}</strong></p>
                    <p>${invoiceData.customer.email}</p>
                </div>
            </div>
            <div>
                <h3 class="section-title">Order Details</h3>
                <div class="customer-info">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Order Date:</span>
                        <span><strong>${formatDate(invoiceData.orderDate)}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Payment Method:</span>
                        <span><strong style="text-transform: capitalize;">${invoiceData.payment.method}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Status:</span>
                        <span class="payment-status" style="${getPaymentStatusColor(invoiceData.payment.status)}">${invoiceData.payment.status.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Order Items Table -->
        <div class="table-container">
            <h3 class="section-title">Order Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th style="text-align: center;">Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.items.map((item: any, index: number) => `
                        <tr>
                            <td>
                                <div>
                                    <div style="font-weight: 500;">${item.name}</div>
                                    ${item.isVirtual ? '<div class="digital-badge">Digital Product</div>' : ''}
                                </div>
                            </td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td>${formatPrice(item.unitPrice)}</td>
                            <td style="font-weight: 600;">${formatPrice(item.totalPrice)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
                <div class="totals-table">
                    <div>
                        <span>Subtotal:</span>
                        <span style="font-weight: 600;">${formatPrice(invoiceData.payment.subtotal)}</span>
                    </div>
                    ${invoiceData.payment.tax > 0 ? `
                    <div>
                        <span>Tax:</span>
                        <span style="font-weight: 600;">${formatPrice(invoiceData.payment.tax)}</span>
                    </div>
                    ` : ''}
                    <div class="totals-separator"></div>
                    <div class="total-row">
                        <span>Total:</span>
                        <span>${formatPrice(invoiceData.payment.total)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Confirmation -->
        <div class="payment-confirmation">
            <h3 style="margin-top: 0;">Payment Confirmation</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0 0 4px 0;">
                        Payment Status: 
                        <span class="payment-status" style="${getPaymentStatusColor(invoiceData.payment.status)}">${invoiceData.payment.status.toUpperCase()}</span>
                    </p>
                    ${invoiceData.payment.transactionId ? `
                    <p style="margin: 0; font-size: 12px; color: #6b7280;">
                        Reference: <span style="font-family: monospace;">${invoiceData.payment.transactionId}</span>
                    </p>
                    ` : ''}
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: 600;">Amount Paid</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">${formatPrice(invoiceData.payment.total)}</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Contact Information</h4>
                    <div>
                        <p>📧 support@compucar.com</p>
                        <p>🌐 https://compucar.com</p>
                        <p>📞 +1 (555) 123-4567</p>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>Company Address</h4>
                    <div>
                        <p>123 Tech Street</p>
                        <p>Digital City, CA 90210</p>
                        <p>USA</p>
                    </div>
                </div>
            </div>
            <div class="legal-notice">
                <p>This invoice is automatically generated and valid without a signature.</p>
                <p style="margin-top: 4px;">Thank you for your business! For support, please contact support@compucar.com</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
