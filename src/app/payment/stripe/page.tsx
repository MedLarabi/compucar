"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function StripePaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  
  const orderId = searchParams.get('orderId');
  const amount = parseFloat(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!orderId) {
      router.push('/checkout');
    }
  }, [orderId, router]);

  const handlePayment = async (success: boolean) => {
    setProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call payment confirmation webhook
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          transactionId: `stripe_${Date.now()}`,
          paymentMethod: 'stripe',
          amount: amount,
          status: success ? 'succeeded' : 'failed',
          webhookSecret: 'test_secret' // In production, this would be verified
        }),
      });

      if (response.ok) {
        if (success) {
          // Redirect to success page
          router.push(`/order/success?orderId=${orderId}&payment=confirmed`);
        } else {
          // Redirect back to checkout with error
          router.push(`/checkout?error=payment_failed&orderId=${orderId}`);
        }
      } else {
        throw new Error('Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!orderId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Stripe Payment</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your payment to confirm your order
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Order #{orderId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(amount)}
              </div>
              <p className="text-sm text-gray-500">Total Amount</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Test Payment Gateway</h3>
              <p className="text-sm text-blue-700">
                This is a mock payment gateway for testing purposes. 
                In production, this would be the actual Stripe checkout interface.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => handlePayment(true)}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Complete Payment
                  </div>
                )}
              </Button>
              
              <Button 
                onClick={() => handlePayment(false)}
                disabled={processing}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Simulate Payment Failure
              </Button>
              
              <Button 
                onClick={() => router.push('/checkout')}
                disabled={processing}
                variant="ghost"
                className="w-full"
                size="sm"
              >
                Cancel Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Secured by Stripe • Test Environment
          </p>
        </div>
      </div>
    </div>
  );
}













