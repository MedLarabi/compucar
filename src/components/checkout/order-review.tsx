"use client";

import { useState } from 'react';
import { useCartStore, useCheckoutStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export function OrderReview() {
  const { items, totalPrice, clearCart, needsShipping, isDigitalOnly } = useCartStore();
  const {
    setStep,
    billingAddress,
    shippingAddress,
    shippingMethod,
    paymentMethod,
    sameAsShipping,
  } = useCheckoutStore();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = totalPrice;
  const shippingCost = needsShipping() ? (shippingMethod?.price || 9.99) : 0;
  const taxAmount = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + taxAmount;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        billingAddress,
        shippingAddress: sameAsShipping ? billingAddress : shippingAddress,
        shippingMethod,
        paymentMethod,
        subtotal,
        shippingCost,
        taxAmount,
        total,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
      
      if (result.success) {
        // Clear cart and redirect to success
        clearCart();
        setStep('success');
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      // You could show a toast error here
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!billingAddress || !shippingMethod || !paymentMethod) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Missing required information</p>
        <Button
          variant="outline"
          onClick={() => setStep('shipping')}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review Your Order</h2>
        <p className="text-muted-foreground">
          Please review your order details before placing your order.
        </p>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.imageAlt || item.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Quantity: {item.quantity}
                </p>
              </div>
              
              <p className="font-semibold">
                {(item.price * item.quantity).toFixed(2)} DA
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shipping Information - only show for physical products */}
      {needsShipping() ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Shipping Address</h4>
              <div className="text-sm text-muted-foreground">
                <p>{shippingAddress?.firstName} {shippingAddress?.lastName}</p>
                {shippingAddress?.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress?.address1}</p>
                {shippingAddress?.address2 && <p>{shippingAddress.address2}</p>}
                <p>
                  {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}
                </p>
                <p>{shippingAddress?.country}</p>
                {shippingAddress?.phone && <p>{shippingAddress.phone}</p>}
              </div>
            </div>

            {!sameAsShipping && (
              <div>
                <h4 className="font-medium mb-2">Billing Address</h4>
                <div className="text-sm text-muted-foreground">
                  <p>{billingAddress.firstName} {billingAddress.lastName}</p>
                  {billingAddress.company && <p>{billingAddress.company}</p>}
                  <p>{billingAddress.address1}</p>
                  {billingAddress.address2 && <p>{billingAddress.address2}</p>}
                  <p>
                    {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                  </p>
                  <p>{billingAddress.country}</p>
                  {billingAddress.phone && <p>{billingAddress.phone}</p>}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{shippingMethod.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {shippingMethod.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{shippingMethod.price.toFixed(2)} DA</p>
                <p className="text-sm text-muted-foreground">
                  {shippingMethod.estimatedDays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Digital Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">No shipping required</p>
                <p className="text-sm text-blue-600">
                  All items will be available for instant download after payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{paymentMethod.name}</p>
              <Badge variant="secondary" className="mt-1">
                Secure Payment
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{subtotal.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shippingCost.toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{taxAmount.toFixed(2)} DA</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{total.toFixed(2)} DA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep('payment')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payment
        </Button>

        <Button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          size="lg"
          className="min-w-48"
        >
          {isPlacingOrder ? (
            'Placing Order...'
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Place Order - {total.toFixed(2)} DA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

