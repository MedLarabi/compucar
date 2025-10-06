"use client";

import { useCartStore, useCheckoutStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, X, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

export function CartReview() {
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();
  const { setStep } = useCheckoutStore();

  const handleProceedToCheckout = () => {
    if (items.length > 0) {
      setStep('checkout');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review Your Cart</h2>
        <p className="text-muted-foreground">
          Review your items and quantities before proceeding to checkout.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
            {/* Product Image */}
            <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.imageAlt || item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 space-y-2">
              <div>
                <Link 
                  href={`/products/${item.slug}`}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                {item.category && (
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.originalPrice * item.quantity)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(item.price)} each
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Cart Actions */}
      <div className="flex items-center justify-between">
        <Link href="/products">
          <Button variant="outline">
            Continue Shopping
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-xl font-bold">{formatPrice(totalPrice)}</p>
          </div>
          
          <Button 
            onClick={handleProceedToCheckout}
            size="lg"
            disabled={items.length === 0}
          >
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

