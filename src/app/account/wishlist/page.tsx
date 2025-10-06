"use client";

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useWishlistStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/components/cart';
import { WishlistButton } from '@/components/wishlist';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AccountWishlistPage() {
  const { items, clearWishlist } = useWishlistStore();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t('wishlist.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('wishlist.description')}
            </p>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('wishlist.empty')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('wishlist.emptyDescription')}
              </p>
              <Link href="/products">
                <Button>
                  {t('wishlist.browseProducts')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              {t('wishlist.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {items.length} {items.length === 1 ? t('wishlist.items').slice(0, -1) : t('wishlist.items')} saved • 
              {t('wishlist.totalValue')}: ${totalValue.toFixed(2)}
            </p>
          </div>
          
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('wishlist.clearWishlist')}
            </Button>
          )}
        </div>

        {/* Wishlist Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-lg font-bold">{items.length}</p>
                  <p className="text-xs text-muted-foreground">{t('wishlist.items')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-lg font-bold">{totalValue.toFixed(2)} DA</p>
                  <p className="text-xs text-muted-foreground">{t('wishlist.totalValue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-lg font-bold">
                    {items.filter(item => item.originalPrice && item.originalPrice > item.price).length}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('wishlist.onSale')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlist Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
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
                          <Package className="h-8 w-8 text-muted-foreground" />
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
                          <span className="text-lg font-bold">{item.price.toFixed(2)} DA</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                {item.originalPrice.toFixed(2)} DA
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                              </Badge>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {t('wishlist.addedOn')} {formatDistanceToNow(new Date(item.addedAt), { addSuffix: true })}
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

        {/* Bulk Actions */}
        {items.length > 1 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{t('wishlist.bulkActions')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('wishlist.bulkActionsDescription')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ${totalValue.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('wishlist.totalValueOf', { count: items.length })}
                    </div>
                  </div>
                  <Button size="lg" disabled>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('wishlist.addAllToCart')}
                    <span className="text-xs ml-1">{t('wishlist.comingSoon')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('wishlist.youMightLike')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('wishlist.recommendationsComingSoon')}
              </p>
              <Link href="/products">
                <Button variant="outline" className="mt-4">
                  {t('wishlist.browseMoreProducts')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


















