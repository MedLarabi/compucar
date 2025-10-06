"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CartSidebar } from './cart-sidebar';

export function CartButton() {
  const [mounted, setMounted] = useState(false);
  const { totalItems, openCart } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <CartSidebar>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 sm:h-10 sm:w-10"
        onClick={openCart}
      >
        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
        {mounted && totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-xs"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
        <span className="sr-only">Open cart</span>
      </Button>
    </CartSidebar>
  );
}






