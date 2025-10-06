"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout-simple";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import { SearchBox } from "@/components/search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  List,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from '@/contexts/LanguageContext';

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

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
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

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<ProductsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentPage = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/products?${params}`;
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

  const fetchCategories = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const apiUrl = `${baseUrl}/api/categories`;
      console.log('Fetching categories from:', apiUrl);
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        console.error(`Unexpected response for categories: status=${response.status}, content-type=${contentType}`);
        setCategories([]);
        return;
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };



  const generatePageUrl = (page: number) => {
    const url = new URLSearchParams(searchParams);
    url.set("page", page.toString());
    return `?${url.toString()}`;
  };

  return (
    <MainLayout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t('navigation.products')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('messages.discoverWideRange')}
          </p>
        </div>

        {/* Smart Search Bar */}
        <div className="mb-6">
          <SearchBox 
            className="max-w-md"
            placeholder={t('search.placeholder')}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <ProductFilters categories={categories} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {pagination && (
                  <p className="text-sm text-muted-foreground">
                    {t('messages.showingResults', { 
                      start: ((pagination.page - 1) * pagination.limit) + 1,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total
                    })}
                  </p>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className={cn(
                "grid gap-6",
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
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
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
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
      </div>
    </MainLayout>
  );
}

