"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { ProductCard } from "@/components/products/product-card";
import { SearchBox } from "@/components/search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  SlidersHorizontal,
  Package,
  Star,
  Zap,
  TrendingUp,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images?: { url: string; alt?: string | null }[];
  averageRating?: number;
  status: string;
  category?: { name: string; slug: string };
  variants?: { id: string; name: string; price: number }[];
  tags?: { tag: { name: string; slug: string } }[];
  _count?: { reviews: number };
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Moved to use dynamic translations inside component

export default function ShopPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  useEffect(() => {
    fetchProducts();
    fetchFeaturedProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const response = await fetch(`/api/products?${params}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.error(`Unexpected response for products: status=${response.status}, content-type=${contentType}`);
        setProducts([]);
        setPagination(null);
        return;
      }
      const data: ProductsResponse = await response.json();
      
      if (data.success && data.data) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        setProducts([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=4&featured=true', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.error(`Unexpected response for featured products: status=${response.status}, content-type=${contentType}`);
        setFeaturedProducts([]);
        return;
      }
      const data: ProductsResponse = await response.json();
      
      if (data.success && data.data) {
        setFeaturedProducts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch featured products:", error);
    }
  };

  const generateUrl = (params: Record<string, string>) => {
    const url = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.set(key, value);
      } else {
        url.delete(key);
      }
    });
    return `?${url.toString()}`;
  };

  const handleSortChange = (sortValue: string) => {
    const [sortBy, sortOrder] = sortValue.split(':');
    const newUrl = generateUrl({ sortBy, sortOrder, page: '1' });
    window.history.pushState({}, '', newUrl);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="px-4 md:px-6">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="text-primary">{t('common.shop')}</span> {t('hero.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('messages.discoverQualityParts')}
              </p>
              
              {/* Featured Search */}
              <div className="max-w-2xl mx-auto">
                <SearchBox 
                  className="w-full"
                  placeholder={t('search.searchFor')}
                  size="lg"
                />
              </div>

              {/* Quick Categories */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {[
                  { name: t('categories.brakeParts'), icon: '🔧' },
                  { name: t('categories.engineParts'), icon: '⚙️' },
                  { name: t('categories.lighting'), icon: '💡' },
                  { name: t('categories.filters'), icon: '🔍' },
                  { name: t('categories.performance'), icon: '🏎️' },
                ].map((category) => (
                  <Link 
                    key={category.name} 
                    href={`/products?search=${encodeURIComponent(category.name)}`}
                  >
                    <Badge 
                      variant="secondary" 
                      className="px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="py-12 border-b">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold flex items-center">
                    <Star className="mr-3 h-8 w-8 text-yellow-500 fill-current" />
                    {t('product.featuredProducts')}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {t('product.handPickedProducts')}
                  </p>
                </div>
                <Link href="/products?featured=true">
                  <Button variant="outline">
                    {t('product.viewAllFeatured')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Shopping Section */}
        <section className="py-12">
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold flex items-center">
                  <Package className="mr-3 h-8 w-8 text-primary" />
                  {t('product.allProducts')}
                </h2>
                {pagination && (
                  <p className="text-muted-foreground mt-2">
                    {t('messages.showingResults', { 
                      start: ((pagination.page - 1) * pagination.limit) + 1,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total
                    })}
                  </p>
                )}
              </div>

              {/* Sort & Filter Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="hidden md:flex"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t('common.filter')}
                </Button>
                
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 bg-background border rounded-md text-sm"
                >
                  <option value="createdAt:desc">{t('filters.newest')}</option>
                  <option value="createdAt:asc">{t('filters.oldest')}</option>
                  <option value="price:asc">{t('filters.priceLowHigh')}</option>
                  <option value="price:desc">{t('filters.priceHighLow')}</option>
                  <option value="name:asc">{t('filters.nameAZ')}</option>
                  <option value="name:desc">{t('filters.nameZA')}</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('messages.noProductsFound')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('messages.tryAdjusting')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/categories">
                    <Button variant="outline">
                      Browse Categories
                    </Button>
                  </Link>
                  <Button onClick={() => window.location.href = '/shop'}>
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  asChild={pagination.page > 1}
                >
                  {pagination.page > 1 ? (
                    <a href={generateUrl({ page: (currentPage - 1).toString() })}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('messages.previous')}
                    </a>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('messages.previous')}
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                    let page;
                    if (pagination.pages <= 7) {
                      page = i + 1;
                    } else if (pagination.page <= 4) {
                      page = i + 1;
                    } else if (pagination.page >= pagination.pages - 3) {
                      page = pagination.pages - 6 + i;
                    } else {
                      page = pagination.page - 3 + i;
                    }

                    const isCurrentPage = page === pagination.page;
                    
                    return (
                      <Button
                        key={page}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        asChild={!isCurrentPage}
                      >
                        {isCurrentPage ? (
                          <span>{page}</span>
                        ) : (
                          <a href={generateUrl({ page: page.toString() })}>{page}</a>
                        )}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  asChild={pagination.page < pagination.pages}
                >
                  {pagination.page < pagination.pages ? (
                    <a href={generateUrl({ page: (currentPage + 1).toString() })}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
                <p className="text-muted-foreground">
                  Get your parts quickly with our expedited shipping options. Most orders ship within 24 hours.
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-muted-foreground">
                  All our products are sourced from trusted manufacturers and come with warranty protection.
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                <p className="text-muted-foreground">
                  Our automotive experts are here to help you find the right parts for your vehicle.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
