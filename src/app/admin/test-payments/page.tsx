"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, X } from 'lucide-react';

export default function TestPaymentsPage() {
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConfirmPayment = async () => {
    if (!orderId) {
      alert('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          transactionId: transactionId.trim() || undefined,
          amount: amount ? parseFloat(amount) : undefined,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message || 'Payment confirmed successfully' });
      } else {
        setResult({ success: false, message: data.error || 'Payment confirmation failed' });
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookTest = async (status: 'succeeded' | 'failed') => {
    if (!orderId) {
      alert('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          transactionId: transactionId.trim() || `test_${Date.now()}`,
          paymentMethod: 'stripe',
          amount: amount ? parseFloat(amount) : 10.00,
          status: status,
          webhookSecret: 'test_secret'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ 
          success: status === 'succeeded', 
          message: data.message || `Payment ${status} webhook processed` 
        });
      } else {
        setResult({ success: false, message: data.error || 'Webhook processing failed' });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      setResult({ success: false, message: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment Testing</h1>
        <p className="text-gray-600">Manually confirm payments for testing purposes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Payment Confirmation</CardTitle>
          <CardDescription>
            Use this tool to manually confirm payments for orders in testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID *</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID to confirm payment"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="transactionId">Transaction ID (optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Custom transaction ID"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (optional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Payment amount"
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : 'Confirm Payment (Manual)'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleWebhookTest('succeeded')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Test Success Webhook
              </Button>
              
              <Button 
                onClick={() => handleWebhookTest('failed')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Test Failed Webhook
              </Button>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              <p className="mt-1 text-sm">{result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How to Test:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Create an order with products (total &gt; 0 DA)</li>
          <li>2. Copy the order ID from the checkout success page</li>
          <li>3. Use this tool to manually confirm the payment</li>
          <li>4. Check that the order status updates and downloads/license keys are available</li>
        </ol>
      </div>
    </div>
  );
}






