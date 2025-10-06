"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Filter } from "lucide-react";

interface ProductFiltersProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
  }>;
  minPrice?: number;
  maxPrice?: number;
}

export function ProductFilters({ 
  categories, 
  minPrice = 0, 
  maxPrice = 1000 
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  const currentCategory = searchParams.get("category");
  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentSort = searchParams.get("sortBy") || "createdAt";
  const currentOrder = searchParams.get("sortOrder") || "desc";

  const [priceRange, setPriceRange] = useState([
    currentMinPrice ? parseInt(currentMinPrice) : minPrice,
    currentMaxPrice ? parseInt(currentMaxPrice) : maxPrice,
  ]);

  const updateUrl = (params: Record<string, string | null>) => {
    const url = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "") {
        url.delete(key);
      } else {
        url.set(key, value);
      }
    });

    // Reset to first page when filters change
    url.set("page", "1");
    
    router.push(`?${url.toString()}`);
  };

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    updateUrl({
      category: checked ? categorySlug : null,
    });
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
  };

  const applyPriceFilter = () => {
    updateUrl({
      minPrice: priceRange[0] > minPrice ? priceRange[0].toString() : null,
      maxPrice: priceRange[1] < maxPrice ? priceRange[1].toString() : null,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    updateUrl({
      sortBy,
      sortOrder,
    });
  };

  const clearFilters = () => {
    router.push("/products");
    setPriceRange([minPrice, maxPrice]);
  };

  const hasActiveFilters = currentCategory || currentMinPrice || currentMaxPrice;

  return (
    <div className="space-y-6">
      {/* Sort */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            {t('filters.sortBy')} & {t('common.filter')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{t('filters.sortBy')}</Label>
            <Select
              value={`${currentSort}-${currentOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">{t('filters.newest')}</SelectItem>
                <SelectItem value="createdAt-asc">{t('filters.oldest')}</SelectItem>
                <SelectItem value="name-asc">{t('filters.nameAZ')}</SelectItem>
                <SelectItem value="name-desc">{t('filters.nameZA')}</SelectItem>
                <SelectItem value="price-asc">{t('filters.priceLowHigh')}</SelectItem>
                <SelectItem value="price-desc">{t('filters.priceHighLow')}</SelectItem>
                <SelectItem value="rating-desc">{t('filters.highestRated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('filters.active')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-sm"
              >
                {t('filters.clearAll')}
              </Button>
            </div>
          )}

          {currentCategory && (
            <Badge variant="secondary" className="gap-1">
{t('product.category')}: {categories.find(c => c.slug === currentCategory)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0"
                onClick={() => updateUrl({ category: null })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('navigation.categories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.slug}
                  checked={currentCategory === category.slug}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category.slug, checked as boolean)
                  }
                />
                <Label
                  htmlFor={category.slug}
                  className="flex-1 cursor-pointer text-sm font-normal"
                >
                  {category.name}
                </Label>
                <span className="text-xs text-muted-foreground">
                  ({category._count.products})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('filters.priceRange')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              min={minPrice}
              max={maxPrice}
              step={10}
              className="w-full"
            />
          </div>
                          <div className="flex items-center justify-between text-sm">
                  <span>{priceRange[0]} DA</span>
                  <span>{priceRange[1]} DA</span>
                </div>
          <Button
            onClick={applyPriceFilter}
            className="w-full"
            size="sm"
            variant="outline"
          >
            {t('filters.apply')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}














