"use client";

import { InvoiceTemplate, InvoiceData } from '@/components/invoice/invoice-template';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

// Sample invoice data for demonstration
const sampleInvoiceData: InvoiceData = {
  invoiceNumber: '1234567890', // Same as order number
  orderNumber: '1234567890',
  invoiceDate: '2024-01-15T10:30:00Z',
  orderDate: '2024-01-15T09:15:00Z',
  
  customer: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    billingAddress: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States'
    }
  },
  
  items: [
    {
      id: '1',
      name: 'ECU Tuning Suite Professional',
      quantity: 1,
      unitPrice: 299.99,
      totalPrice: 299.99,
      isVirtual: true
    },
    {
      id: '2',
      name: 'Vehicle Diagnostic Database',
      quantity: 2,
      unitPrice: 49.99,
      totalPrice: 99.98,
      isVirtual: true
    },
    {
      id: '3',
      name: 'OBD-II Scanner Software License',
      quantity: 1,
      unitPrice: 149.99,
      totalPrice: 149.99,
      isVirtual: true
    }
  ],
  
  payment: {
    method: 'stripe',
    status: 'paid',
    transactionId: 'pi_1AbCdEfGhIjKlMnOpQrStUvW',
    subtotal: 549.96,
    tax: 0,
    total: 549.96
  }
};

export default function InvoiceDemoPage() {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real implementation, you would generate a PDF here
    alert('PDF download functionality would be implemented here using libraries like jsPDF or Puppeteer');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Template Demo</h1>
            <p className="text-gray-600">Professional invoice template for digital products</p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Template */}
        <InvoiceTemplate 
          data={sampleInvoiceData} 
          className="print:shadow-none print:max-w-none"
        />

        {/* Template Features */}
        <div className="mt-12 no-print">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Template Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Design</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Professional, modern layout</li>
                  <li>• A4 size optimized for PDF export</li>
                  <li>• Clean typography (Inter font)</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Content</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Company branding & logo</li>
                  <li>• Customer information</li>
                  <li>• Detailed order table</li>
                  <li>• Payment confirmation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Functionality</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Print-ready styling</li>
                  <li>• Dynamic data binding</li>
                  <li>• Status badges & indicators</li>
                  <li>• Contact information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .invoice-container {
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
