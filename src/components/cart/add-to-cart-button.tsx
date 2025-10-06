"use client";

import { useState } from 'react';
import { useCartStore } from '@/stores';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Plus } from 'lucide-react';
import { CartItem } from '@/types/cart';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    category?: string;
    image?: string;
    imageAlt?: string;
    maxQuantity?: number;
    isVirtual?: boolean;
    isDigital?: boolean;
    requiresShipping?: boolean;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
  quantity?: number;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
  size = 'default',
  className,
  showIcon = true,
  children,
}: AddToCartButtonProps) {
  const { addItem, openCart } = useCartStore();
  const { t } = useLanguage();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    const finalPrice = variant?.price || product.price;

    const cartItem: Omit<CartItem, 'id'> = {
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      slug: product.slug,
      price: finalPrice,
      originalPrice: product.originalPrice,
      quantity,
      maxQuantity: 99, // Generic max quantity for cart management
      image: product.image,
      imageAlt: product.imageAlt,
      category: product.category,
      variantName: variant?.name,
      // Physical product flags (all our products are physical)
      isVirtual: false,
      isDigital: false,
      requiresShipping: true,
    };

    addItem(cartItem);

    // Show success state
    setIsAdded(true);
    
    // Automatically open the cart sidebar
    openCart();

    // Reset success state after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      size={size}
      className={className}
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          {t('cart.addedToCart') || 'Added to Cart!'}
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
          {children || t('product.addToCart')}
        </>
      )}
    </Button>
  );
}

export function QuickAddButton({
  product,
  variant,
  className,
}: Omit<AddToCartButtonProps, 'children' | 'showIcon' | 'size'>) {
  return (
    <AddToCartButton
      product={product}
      variant={variant}
      size="sm"
      className={className}
      showIcon={false}
    >
      <Plus className="h-4 w-4" />
    </AddToCartButton>
  );
}






