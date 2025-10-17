"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/products/product-card";
import { HorizontalFilters } from "@/components/products/horizontal-filters";
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowRight, 
  ChevronUp,
  ChevronDown,
  Grid3X3, 
  List,
  Package,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  _count?: { reviews: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface HomePageClientProps {
  // No initial props needed, back to client-side fetching
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

export function HomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  
  const productsRef = useRef<HTMLElement>(null);
  
  const { t } = useLanguage();

  useEffect(() => {
    // Reset when filters change
    setCurrentPage(1);
    setProducts([]);
    fetchProducts(1, false);
  }, [searchParams]);

  // Scroll to products when search params change (user searched)
  useEffect(() => {
    const search = searchParams.get("search");
    if (search && productsRef.current) {
      // Small delay to ensure products have loaded
      setTimeout(() => {
        productsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [searchParams]);



  const fetchProducts = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      // Use relative URL instead of constructing absolute URL
      const apiUrl = `/api/products?${params}`;
      console.log('Fetching products from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.error(`Unexpected response for products: status=${response.status}, content-type=${contentType}`);
        if (!append) {
          setProducts([]);
          setPagination(null);
        }
        return;
      }
      const data: ProductsResponse = await response.json();
      
      if (data.success && data.data) {
        if (append) {
          setProducts(prev => [...prev, ...data.data]);
        } else {
          setProducts(data.data);
        }
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        if (!append) {
          setProducts([]);
          setPagination(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      if (!append) {
        setProducts([]);
        setPagination(null);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (pagination && currentPage < pagination.pages) {
      fetchProducts(currentPage + 1, true);
    }
  };



  const generatePageUrl = (page: number) => {
    const url = new URLSearchParams(searchParams);
    url.set("page", page.toString());
    return `?${url.toString()}`;
  };



  // Hero section button handlers
  const handleShopNow = () => {
    router.push('/products');
  };

  const handleBrowseCategories = () => {
    router.push('/products?view=categories');
  };



  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background py-8 md:py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center space-y-3 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {t('hero.title')}
              <span className="block text-primary">{t('hero.subtitle')}</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-sm md:text-base">
              {t('welcome')}
            </p>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-xs md:text-sm">
              {t('hero.description')}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                size="default" 
                className="h-10 px-6"
                onClick={handleShopNow}
              >
                {t('hero.shopNow')}
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
              <Button 
                size="default" 
                variant="outline" 
                className="h-10 px-6"
                onClick={handleBrowseCategories}
              >
                {t('hero.browseCategories')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Horizontal Filters with Search */}
          <HorizontalFilters 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Main Content */}
          <main ref={productsRef}>
            {/* Products Grid/List */}
              {loading ? (
                <div className={cn(
                  "grid gap-6",
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                )}>
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
                <>
                  <div className={cn(
                    "grid gap-6",
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                      : "grid-cols-1"
                  )}>
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        className={viewMode === "list" ? "flex-row" : ""}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {pagination && currentPage < pagination.pages && (
                    <div className="mt-8 flex justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="min-w-[200px]"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          <>
                            {t('common.loadMore')}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Show total loaded products */}
                  {pagination && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      {t('messages.showing')} {products.length} {t('common.of')} {pagination.total} {t('common.products')}
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('messages.noProductsFound')}</h3>
                  <p className="text-muted-foreground">
                    {t('messages.tryAdjusting')}
                  </p>
                </Card>
              )}
            </main>
        </div>
      </section>



    </MainLayout>
  );
}
