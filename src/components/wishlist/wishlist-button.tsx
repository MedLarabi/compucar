"use client";

import { useWishlistStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number;
    category?: string;
    image?: string;
    imageAlt?: string;
  };
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

export function WishlistButton({
  product,
  size = 'default',
  variant = 'outline',
  className,
  showText = false,
}: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const { t } = useLanguage();
  const inWishlist = isInWishlist(product.id);

  const handleToggle = () => {
    if (inWishlist) {
      removeItem(product.id);
      toast.info(`${product.name} removed from wishlist`);
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        imageAlt: product.imageAlt,
        category: product.category,
      });
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        'transition-colors',
        inWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          showText && 'mr-2',
          inWishlist && 'fill-current'
        )}
      />
      {showText && (inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist'))}
      <span className="sr-only">
        {inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      </span>
    </Button>
  );
}














