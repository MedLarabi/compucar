"use client";

import { useWishlistStore } from "@/stores";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart";
import { WishlistButton } from "@/components/wishlist";
import { formatPrice } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('wishlist.empty')}</h1>
              <p className="text-muted-foreground">
                {t('wishlist.emptyDescription')}
              </p>
            </div>
            <Link href="/products">
              <Button size="lg">
                {t('wishlist.browseProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500" />
                {t('wishlist.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? t('cart.item') : t('cart.items')} {t('wishlist.saved')}
              </p>
            </div>
            
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={clearWishlist}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('wishlist.clearAll')}
              </Button>
            )}
          </div>

          {/* Wishlist Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Product Image */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-32 bg-muted">
                      <Link href={`/products/${item.slug}`}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.imageAlt || item.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between h-full">
                        <div className="flex-1 space-y-2">
                          <div>
                            <Link href={`/products/${item.slug}`}>
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>
                            {item.category && (
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{formatPrice(item.price)}</span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <>
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatPrice(item.originalPrice)}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                                </Badge>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            Added {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0 sm:ml-4">
                          <AddToCartButton
                            product={{
                              id: item.productId,
                              name: item.name,
                              slug: item.slug,
                              price: item.price,
                              originalPrice: item.originalPrice,
                              category: item.category,
                              image: item.image,
                              imageAlt: item.imageAlt,
                              maxQuantity: 99,
                            }}
                            size="sm"
                            className="flex-1 sm:w-32"
                          />
                          
                          <WishlistButton
                            product={{
                              id: item.productId,
                              name: item.name,
                              slug: item.slug,
                              price: item.price,
                              originalPrice: item.originalPrice,
                              category: item.category,
                              image: item.image,
                              imageAlt: item.imageAlt,
                            }}
                            variant="outline"
                            size="sm"
                            showText={false}
                            className="sm:w-32"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add All to Cart */}
          {items.length > 1 && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Add All to Cart</h3>
                    <p className="text-sm text-muted-foreground">
                      Add all {items.length} items to your cart at once
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {items.reduce((sum, item) => sum + item.price, 0).toFixed(2)} DA
                      </div>
                      {items.some(item => item.originalPrice && item.originalPrice > item.price) && (
                        <div className="text-sm text-muted-foreground line-through">
                          {items.reduce((sum, item) => sum + (item.originalPrice || item.price), 0).toFixed(2)} DA
                        </div>
                      )}
                    </div>
                    <Button size="lg">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add All to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

