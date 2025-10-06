"use client";

import { MainLayout } from '@/components/layout/main-layout-simple';
import { useCartStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CartPage() {
  const { items, clearCart, totalItems, totalPrice } = useCartStore();
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="container py-6 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t('cart.title')}</h1>
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">{t('cart.empty')}</p>
              <Link href="/products">
                <Button>{t('cart.continueShopping')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3 flex gap-3 items-center">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                      <Image src={item.image || '/api/placeholder/64/64'} alt={item.imageAlt || item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{t('cart.qty')}: {item.quantity}</div>
                    </div>
                    <div className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>{t('cart.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{t('cart.items')}</span>
                    <span>{totalItems}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Link href="/checkout/cod">
                      <Button className="w-full">{t('cart.checkoutCOD')}</Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={clearCart}>{t('cart.clearCart')}</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}


