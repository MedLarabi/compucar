"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchBox } from "@/components/search";
import { X, ChevronDown, DollarSign, SortAsc, Grid3X3, List } from "lucide-react";

interface HorizontalFiltersProps {
  minPrice?: number;
  maxPrice?: number;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export function HorizontalFilters({ 
  minPrice = 0, 
  maxPrice = 1000,
  viewMode = "grid",
  onViewModeChange
}: HorizontalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  const currentMinPrice = mounted ? searchParams.get("minPrice") : null;
  const currentMaxPrice = mounted ? searchParams.get("maxPrice") : null;
  const currentSort = mounted ? searchParams.get("sortBy") || "createdAt" : "createdAt";
  const currentOrder = mounted ? searchParams.get("sortOrder") || "desc" : "desc";
  
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);

  // Handle hydration and sync with URL params
  useEffect(() => {
    setMounted(true);
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    
    setPriceRange([
      minPriceParam ? parseInt(minPriceParam) : minPrice,
      maxPriceParam ? parseInt(maxPriceParam) : maxPrice,
    ]);
  }, [searchParams, minPrice, maxPrice]);

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
    router.push("/");
    setPriceRange([minPrice, maxPrice]);
  };

  const hasActiveFilters = mounted && (currentMinPrice || currentMaxPrice);

  const getSortLabel = () => {
    const sortOptions = {
      "createdAt-desc": t('filters.newest'),
      "createdAt-asc": t('filters.oldest'), 
      "name-asc": t('filters.nameAZ'),
      "name-desc": t('filters.nameZA'),
      "price-asc": t('filters.priceLowHigh'),
      "price-desc": t('filters.priceHighLow'),
      "rating-desc": t('filters.highestRated'),
    };
    return sortOptions[`${currentSort}-${currentOrder}` as keyof typeof sortOptions] || t('filters.newest');
  };

  // Don't render form controls until after hydration to prevent mismatch
  if (!mounted) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
            {/* Skeleton while hydrating */}
            <div className="flex-1 min-w-0 sm:min-w-[250px] max-w-[500px]">
              <div className="h-9 bg-muted rounded-md animate-pulse" />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[200px] h-9 bg-muted rounded-md animate-pulse" />
            <div className="w-full sm:w-auto sm:min-w-[120px] h-9 bg-muted rounded-md animate-pulse" />
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <div className="h-9 w-9 bg-muted rounded-md animate-pulse" />
              <div className="h-9 w-9 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
          {/* Search Box */}
          <div className="flex-1 min-w-0 sm:min-w-[250px] max-w-[500px]">
            <SearchBox 
              className="w-full h-9"
              placeholder={t('search.placeholder')}
              size="md"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <Select
              value={`${currentSort}-${currentOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="h-9 w-full">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
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

          {/* Price Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="h-9 gap-2 w-full sm:w-auto sm:min-w-[120px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    {currentMinPrice || currentMaxPrice 
                      ? `${priceRange[0]}-${priceRange[1]} DA`
                      : t('filters.price')
                    }
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">{t('product.priceRange')}</h4>
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
                >
                  {t('filters.apply')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground">Active:</span>
              
              {(currentMinPrice || currentMaxPrice) && (
                <Badge variant="secondary" className="gap-1">
                  {priceRange[0]}-{priceRange[1]} DA
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => updateUrl({ minPrice: null, maxPrice: null })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-sm"
              >
                {t('filters.clearAll')}
              </Button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start sm:ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange?.("grid")}
              className="h-9 w-9 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange?.("list")}
              className="h-9 w-9 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
