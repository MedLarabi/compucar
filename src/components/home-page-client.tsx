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
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  List,
  Package
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const productsRef = useRef<HTMLElement>(null);
  
  const { t } = useLanguage();

  const currentPage = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    fetchProducts();
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



  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
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
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
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
                <div className={cn(
                  "grid gap-6",
                  viewMode === "grid" 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
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
              ) : (
                <Card className="p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('messages.noProductsFound')}</h3>
                  <p className="text-muted-foreground">
                    {t('messages.tryAdjusting')}
                  </p>
                </Card>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    asChild={pagination.page > 1}
                  >
                    {pagination.page > 1 ? (
                      <a href={generatePageUrl(currentPage - 1)}>
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
                    {[...Array(pagination.pages)].map((_, i) => {
                      const page = i + 1;
                      const isCurrentPage = page === pagination.page;
                      
                      // Show first page, last page, current page, and pages around current
                      const shouldShow = 
                        page === 1 ||
                        page === pagination.pages ||
                        Math.abs(page - pagination.page) <= 1;

                      if (!shouldShow) {
                        // Show ellipsis
                        if (page === 2 && pagination.page > 4) {
                          return <span key={page} className="px-2">...</span>;
                        }
                        if (page === pagination.pages - 1 && pagination.page < pagination.pages - 3) {
                          return <span key={page} className="px-2">...</span>;
                        }
                        return null;
                      }

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
                            <a href={generatePageUrl(page)}>{page}</a>
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
                      <a href={generatePageUrl(currentPage + 1)}>
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <>
                        {t('common.next')}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </main>
        </div>
      </section>



    </MainLayout>
  );
}
