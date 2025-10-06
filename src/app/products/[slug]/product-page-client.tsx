"use client";

import { useState } from "react";
import Image from "next/image";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductMediaViewer } from "@/components/product/product-media-viewer";

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
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { t } = useLanguage();

  // Enhanced add to cart with optimistic updates
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity,
        maxQuantity: 99,
        variant: selectedVariant,
        image: product.images?.[0]?.url || '/api/placeholder/400/400',
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
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-gray-600 leading-relaxed">
                {product.shortDescription}
              </p>
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
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable || isAddingToCart}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isAddingToCart ? t('cart.adding') : t('product.addToCart')}
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
          
          <div className="space-y-6">
            <ReviewsDisplay 
              reviews={product.reviews || []} 
              averageRating={product.averageRating || 0}
              totalReviews={product._count?.reviews || 0}
            />
            
            {showReviewForm && (
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
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
