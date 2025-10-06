"use client";

import { useCartStore } from '@/stores';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Plus, Minus, X, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

export function CartSidebar({ children }: { children?: React.ReactNode }) {
  const { items, isOpen, totalItems, totalPrice, closeCart } = useCartStore();
  const { t } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('cart.title')}
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems} {totalItems === 1 ? t('cart.item') : t('cart.items')}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">{t('cart.empty')}</h3>
              <p className="text-muted-foreground">{t('cart.addProductsToStart')}</p>
            </div>
            <Link href="/products">
              <Button onClick={closeCart}>
                {t('cart.continue')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-6">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-6 pt-6 px-2 border-t">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span className="font-semibold">{totalPrice ? totalPrice.toFixed(2) : '0.00'} DA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="text-sm text-muted-foreground">{t('cart.calculatedAtCheckout')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('cart.total')}</span>
                  <span>{totalPrice ? totalPrice.toFixed(2) : '0.00'} DA</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/checkout">
                  <Button className="w-full" size="lg" onClick={closeCart}>
                    {t('cart.checkout')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button variant="outline" className="w-full" onClick={closeCart}>
                    {t('cart.viewCart')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartItem({ item }: { item: any }) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-muted/20 rounded-lg border">
      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.imageAlt || item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
            {item.variantName && (
              <p className="text-xs text-muted-foreground">{item.variantName}</p>
            )}
            {item.category && (
              <p className="text-xs text-muted-foreground">{item.category}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleQuantityChange(item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= item.maxQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <div className="text-sm font-semibold">
              {(item.price * item.quantity).toFixed(2)} DA
            </div>
            {item.originalPrice && item.originalPrice > item.price && (
              <div className="text-xs text-muted-foreground line-through">
                {(item.originalPrice * item.quantity).toFixed(2)} DA
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
