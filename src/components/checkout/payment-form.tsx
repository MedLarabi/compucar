"use client";

import { useState } from 'react';
import { useCheckoutStore, useCartStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { PaymentMethod } from '@/types/checkout';

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit or Debit Card',
    icon: 'credit-card',
  },
  {
    id: 'apple_pay',
    type: 'apple_pay',
    name: 'Apple Pay',
    icon: 'smartphone',
  },
  {
    id: 'google_pay',
    type: 'google_pay',
    name: 'Google Pay',
    icon: 'wallet',
  },
];

export function PaymentForm() {
  const { setStep, setPaymentMethod, paymentMethod } = useCheckoutStore();
  const { totalPrice } = useCartStore();
  
  const [selectedPayment, setSelectedPayment] = useState<string>(
    paymentMethod?.id || 'card'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinueToReview = () => {
    const method = PAYMENT_METHODS.find(m => m.id === selectedPayment);
    if (method) {
      setPaymentMethod(method);
      setStep('review');
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    try {
      // For now, we'll just simulate payment processing
      // In a real implementation, you would integrate with Stripe Elements here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      setStep('success');
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentIcon = (iconType: string) => {
    switch (iconType) {
      case 'credit-card':
        return <CreditCard className="h-5 w-5" />;
      case 'smartphone':
        return <Smartphone className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
        <p className="text-muted-foreground">
          Choose how you'd like to pay for your order.
        </p>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPayment}
            onValueChange={setSelectedPayment}
            className="space-y-3"
          >
            {PAYMENT_METHODS.map((method) => (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label
                  htmlFor={method.id}
                  className="flex items-center gap-3 cursor-pointer flex-1 p-3 rounded-lg border transition-colors hover:bg-muted"
                >
                  <div className="p-2 rounded-md bg-muted">
                    {getPaymentIcon(method.icon || 'credit-card')}
                  </div>
                  <span className="font-medium">{method.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Details */}
      {selectedPayment === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>Card Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Stripe payment form will be integrated here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Secure payment processing powered by Stripe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{totalPrice ? totalPrice.toFixed(2) : '0.00'} DA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>9.99 DA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{totalPrice ? (totalPrice * 0.08).toFixed(2) : '0.00'} DA</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{totalPrice ? (totalPrice + 9.99 + (totalPrice * 0.08)).toFixed(2) : '9.99'} DA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('shipping')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shipping
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleContinueToReview}
          >
            Review Order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="min-w-32"
          >
            {isProcessing ? 'Processing...' : `Pay ${totalPrice ? (totalPrice + 9.99 + (totalPrice * 0.08)).toFixed(2) : '9.99'} DA`}
          </Button>
        </div>
      </div>
    </div>
  );
}







