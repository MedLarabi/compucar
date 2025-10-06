"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores';

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();

  // Redirect to COD checkout (our new flow)
  useEffect(() => {
    if (items.length === 0) {
      router.push('/products');
    } else {
      router.push('/checkout/cod');
    }
  }, [items.length, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}