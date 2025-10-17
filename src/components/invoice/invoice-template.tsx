"use client";

import React from 'react';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Invoice data interface
export interface InvoiceData {
  // Invoice details
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  orderDate: string;
  
  // Customer information
  customer: {
    name: string;
    email: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  
  // Order items
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isVirtual?: boolean;
  }>;
  
  // Payment information
  payment: {
    method: string;
    status: 'paid' | 'pending' | 'failed';
    transactionId?: string;
    subtotal: number;
    tax: number;
    total: number;
  };
}

// Company information (you can move this to a config file)
const COMPANY_INFO = {
  name: '',
  logo: '/logo.png',
  address: {
    street: '123 Tech Street',
    city: 'Digital City',
    state: 'CA',
    zipCode: '90210',
    country: 'USA'
  },
  contact: {
    website: 'https://compucar.com',
    email: 'support@compucar.com',
    phone: '+1 (555) 123-4567'
  }
};

interface InvoiceTemplateProps {
  data: InvoiceData;
  className?: string;
}

export function InvoiceTemplate({ data, className = '' }: InvoiceTemplateProps) {
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto bg-white shadow-lg ${className}`}>
      {/* A4 size container for PDF export */}
      <div className="invoice-container min-h-[297mm] p-8 font-sans text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          {/* Company Logo and Name */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              {/* Placeholder logo - replace with actual logo */}
              <span>CC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{COMPANY_INFO.name}</h1>
              <p className="text-sm text-gray-600">Digital Products & Solutions</p>
            </div>
          </div>

          {/* Invoice Title and Details */}
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">INVOICE</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between w-48">
                <span className="text-gray-600">Invoice #:</span>
                <span className="font-semibold">{data.invoiceNumber}</span>
              </div>
              <div className="flex justify-between w-48">
                <span className="text-gray-600">Order #:</span>
                <span className="font-semibold">{data.orderNumber}</span>
              </div>
              <div className="flex justify-between w-48">
                <span className="text-gray-600">Invoice Date:</span>
                <span className="font-semibold">{formatDate(data.invoiceDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Bill To
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{data.customer.name}</p>
              <p className="text-gray-600">{data.customer.email}</p>
              {data.customer.billingAddress && (
                <div className="text-gray-600 mt-2">
                  {data.customer.billingAddress.street && (
                    <p>{data.customer.billingAddress.street}</p>
                  )}
                  <p>
                    {[
                      data.customer.billingAddress.city,
                      data.customer.billingAddress.state,
                      data.customer.billingAddress.zipCode
                    ].filter(Boolean).join(', ')}
                  </p>
                  {data.customer.billingAddress.country && (
                    <p>{data.customer.billingAddress.country}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
              Order Details
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="font-semibold">{formatDate(data.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold capitalize">{data.payment.method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <Badge 
                  variant="secondary" 
                  className={`${getPaymentStatusColor(data.payment.status)} text-xs font-semibold px-2 py-1`}
                >
                  {data.payment.status.toUpperCase()}
                </Badge>
              </div>
              {data.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs">{data.payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.isVirtual && (
                            <div className="text-xs text-blue-600 font-medium">Digital Product</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Summary */}
          <div className="mt-6 flex justify-end">
            <div className="w-80">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatPrice(data.payment.subtotal)}</span>
                </div>
                {data.payment.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">{formatPrice(data.payment.tax)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatPrice(data.payment.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Confirmation</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Payment Status: 
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${getPaymentStatusColor(data.payment.status)} text-xs font-semibold`}
                >
                  {data.payment.status.toUpperCase()}
                </Badge>
              </p>
              {data.payment.transactionId && (
                <p className="text-xs text-gray-500">
                  Reference: <span className="font-mono">{data.payment.transactionId}</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Amount Paid</p>
              <p className="text-lg font-bold text-green-600">{formatPrice(data.payment.total)}</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            {/* Company Contact Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📧 {COMPANY_INFO.contact.email}</p>
                <p>🌐 {COMPANY_INFO.contact.website}</p>
                <p>📞 {COMPANY_INFO.contact.phone}</p>
              </div>
            </div>

            {/* Company Address */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Company Address</h4>
              <div className="text-sm text-gray-600">
                <p>{COMPANY_INFO.address.street}</p>
                <p>
                  {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state} {COMPANY_INFO.address.zipCode}
                </p>
                <p>{COMPANY_INFO.address.country}</p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-center text-xs text-gray-500 italic border-t border-gray-100 pt-4">
            <p>This invoice is automatically generated and valid without a signature.</p>
            <p className="mt-1">Thank you for your business! For support, please contact {COMPANY_INFO.contact.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
