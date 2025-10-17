"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import Link from "next/link";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton, QuickAddButton } from "@/components/cart";
import { WishlistButton } from "@/components/wishlist";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Star,
  Eye,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images?: { url: string; alt?: string | null }[];
    averageRating?: number;
    reviewCount?: number;
    status: string;
    category?: { name: string; slug: string };
    variants?: { id: string; name: string; price: number }[];
    tags?: { name: string; slug: string }[];
    _count?: { reviews: number };
  };
  className?: string;
  showQuickAdd?: boolean;
}

export function ProductCard({ 
  product, 
  className,
  showQuickAdd = true 
}: ProductCardProps) {
  const { t } = useLanguage();
  // Create product object for cart/wishlist components
  const productForComponents = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    originalPrice: product.compareAtPrice || undefined,
    category: product.category?.name,
    image: product.images?.[0]?.url,
    imageAlt: product.images?.[0]?.alt || product.name,
    maxQuantity: 99, // Default max quantity, you might want to get this from API
  };

  const discountPercentage = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const averageRating = product.averageRating || 0;
  const reviewCount = product._count?.reviews || product.reviewCount || 0;

  return (
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg flex flex-col", className)}>
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${product.slug}`}>
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              quality={80}
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
          {product.status === "NEW" && (
            <Badge className="bg-green-500 text-xs">
              {t('product.new')}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <WishlistButton
            product={productForComponents}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            asChild
          >
            <Link href={`/products/${product.slug}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick Add Button */}
        {showQuickAdd && (
          <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <AddToCartButton
              product={productForComponents}
              size="sm"
              className="w-full"
            />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="space-y-2 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <Link 
              href={`/products?category=${product.category.slug}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {product.category.name}
            </Link>
          )}

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold leading-tight hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {averageRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}

          {/* Variants Preview */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {product.variants.slice(0, 3).map((variant) => (
                <Badge key={variant.id} variant="outline" className="text-xs">
                  {variant.name}
                </Badge>
              ))}
              {product.variants.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{product.variants.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag, index) => (
                <Badge key={tag.slug || `tag-${index}`} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Spacer to push price to bottom */}
          <div className="flex-1"></div>

          {/* Price - Fixed at bottom center */}
          <div className="flex items-center justify-center gap-2 mt-auto pb-1">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
