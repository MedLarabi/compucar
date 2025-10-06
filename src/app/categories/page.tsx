"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { SearchBox } from "@/components/search";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Grid3X3, FolderOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from '@/contexts/LanguageContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  _count: {
    products: number;
  };
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    _count: {
      products: number;
    };
  }>;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Filter to show only top-level categories (no parent)
        const topLevelCategories = data.filter((cat: Category) => !cat.parent);
        setCategories(topLevelCategories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(t('categories.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('categories.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('categories.description')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <SearchBox 
            className="max-w-lg w-full"
            placeholder={t('categories.searchPlaceholder')}
            size="lg"
          />
        </div>

        {/* Categories Grid */}
        {error ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-destructive">{t('categories.errorLoading')}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCategories} variant="outline">
              {t('common.tryAgain')}
            </Button>
          </Card>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('categories.noCategoriesFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('categories.organizingCategories')}
            </p>
            <Link href="/products">
              <Button>
                {t('categories.browseAllProducts')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.slug}`}>
                  <Card className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 h-full">
                    {/* Category Image */}
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full group-hover:bg-muted/80 transition-colors">
                          <FolderOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Product Count Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-background/90 text-foreground">
                          {category._count.products} {category._count.products === 1 ? t('common.product') : t('common.products')}
                        </Badge>
                      </div>
                    </div>

                    {/* Category Info */}
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {category.name}
                        </h3>
                        
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        )}

                        {/* Subcategories Preview */}
                        {category.children && category.children.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t('categories.subcategories')}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {category.children.slice(0, 3).map((child) => (
                                <Badge key={child.id} variant="outline" className="text-xs">
                                  {child.name}
                                </Badge>
                              ))}
                              {category.children.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{category.children.length - 3} {t('categories.more')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Products Button */}
                        <div className="pt-2">
                          <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                            <span>{t('categories.viewProducts')}</span>
                            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-2">{t('categories.cantFind')}</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('categories.browseAllDescription')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/products">
                      <Button size="lg">
                        <Grid3X3 className="mr-2 h-5 w-5" />
                        {t('categories.browseAllProducts')}
                      </Button>
                    </Link>
                    <Link href="/search">
                      <Button variant="outline" size="lg">
                        <Package className="mr-2 h-5 w-5" />
                        {t('categories.advancedSearch')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
