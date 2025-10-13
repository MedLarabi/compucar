"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductMediaViewer } from "@/components/product/product-media-viewer";
import { ProductVariantSelector } from "@/components/product/product-variant-selector";

import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { ReviewForm } from "@/components/product/review-form";
import { ReviewsDisplay } from "@/components/product/reviews-display";
import {
  Heart,
  ShoppingCart,
  Star,
  Share2,
  Check,
  Truck,
  Shield,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductPageClientProps {
  product: any; // Use the product type from your schema
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [variantImages, setVariantImages] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentCompareAtPrice, setCurrentCompareAtPrice] = useState(product.compareAtPrice);

  const { addItem, openCart } = useCartStore();
  const { t } = useLanguage();

  // Memoized callback functions to prevent infinite re-renders
  const handleVariantChange = useCallback((variant: any) => {
    setSelectedVariant(variant);
    // Reset quantity to 1 when variant changes
    setQuantity(1);
  }, []);

  const handlePriceChange = useCallback((price: number, compareAtPrice?: number) => {
    setCurrentPrice(price);
    setCurrentCompareAtPrice(compareAtPrice);
  }, []);

  const handleImagesChange = useCallback((images: any[]) => {
    setVariantImages(images);
  }, []);

  // Enhanced add to cart with optimistic updates
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        quantity,
        maxQuantity: selectedVariant?.stockLevel === 'high' ? 10 : 
                     selectedVariant?.stockLevel === 'low' ? 3 : 1,
        variant: selectedVariant,
        image: variantImages.length > 0 
          ? variantImages.find(img => img.isMain)?.url || variantImages[0]?.url
          : product.images?.[0]?.url || '/api/placeholder/400/400',
      };

      addItem(cartItem);
      
      // Automatically open the cart sidebar
      openCart();
      
      toast.success(t('cart.addedToCart'), {
        action: {
          label: t('cart.viewCart'),
          onClick: () => openCart(),
        },
      });
    } catch (error) {
      toast.error(t('cart.failedToAdd'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('product.linkCopied'));
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('product.linkCopied'));
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Media */}
          <ProductMediaViewer
            images={product.images || []}
            videos={product.videos || []}
            productName={product.name}
            variantImages={variantImages}
          />

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category?.name}</Badge>
                {product.isFeatured && (
                  <Badge variant="default" className="bg-yellow-500">
                    {t('product.featured')}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(product.averageRating || 0)}
                  <span className="text-sm text-gray-600 ml-1">
                    ({product.averageRating?.toFixed(1) || '0.0'})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {product._count?.reviews || 0} {t('product.reviews')}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(currentPrice)}
                </span>
                {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(currentCompareAtPrice)}
                  </span>
                )}
              </div>

              {/* SKU - Only show main product SKU when no variant is selected */}
              {!selectedVariant && product.sku && (
                <div className="text-sm text-gray-600">
                  SKU: {product.sku}
                </div>
              )}
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <ProductVariantSelector
                  variants={product.variants}
                  defaultPrice={product.price}
                  defaultCompareAtPrice={product.compareAtPrice}
                  onVariantChange={handleVariantChange}
                  onPriceChange={handlePriceChange}
                  onImagesChange={handleImagesChange}
                />
                <Separator />
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">{t('product.quantity')}:</label>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x">{quantity}</span>
                  <button
                    onClick={() => {
                      // Allow up to 10 items if in stock, but limit based on stock level
                      const maxQuantity = selectedVariant?.stockLevel === 'high' ? 10 : 
                                         selectedVariant?.stockLevel === 'low' ? 3 : 1;
                      setQuantity(Math.min(quantity + 1, maxQuantity));
                    }}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    disabled={
                      selectedVariant ? !selectedVariant.inStock : false
                    }
                  >
                    +
                  </button>
                </div>
                {selectedVariant && (
                  <span className="text-xs text-muted-foreground">
                    {selectedVariant.inStock 
                      ? `${selectedVariant.stockLevel === 'high' ? 'In stock' : 'Limited stock'}` 
                      : 'Out of stock'}
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={
                    isAddingToCart || 
                    (selectedVariant ? !selectedVariant.inStock : !product.isAvailable)
                  }
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isAddingToCart ? t('cart.adding') : 
                   (selectedVariant && !selectedVariant.inStock) ? t('product.outOfStock') :
                   (!product.isAvailable && !selectedVariant) ? t('product.outOfStock') :
                   t('product.addToCart')}
                </Button>
                
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {!product.isAvailable && (
                <p className="text-red-600 text-sm">{t('product.outOfStock')}</p>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4" />
                {t('product.freeShipping')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                {t('product.warranty')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4" />
                {t('product.returns')}
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">{t('product.description')}</h2>
          <Card>
            <CardContent className="p-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Product Reviews */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {t('product.reviews')} ({product._count?.reviews || 0})
            </h2>
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              variant={showReviewForm ? "outline" : "default"}
              className="transition-all duration-200"
            >
              {showReviewForm ? t('common.cancel') : t('product.writeReview')}
            </Button>
          </div>
          
          {/* Show review form right below the button when toggled */}
          {showReviewForm && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('product.writeReview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewForm 
                    productSlug={product.slug} 
                    productName={product.name}
                    onReviewSubmitted={() => setShowReviewForm(false)}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="space-y-6">
            <ReviewsDisplay 
              productSlug={product.slug}
              initialReviews={product.reviews || []}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
