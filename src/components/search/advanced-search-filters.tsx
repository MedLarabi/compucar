"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Filter, 
  X, 
  Star, 
  DollarSign,
  Tag,
  Truck,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface Brand {
  name: string;
  count: number;
}

interface AdvancedSearchFiltersProps {
  categories?: Category[];
  brands?: Brand[];
  className?: string;
}

export function AdvancedSearchFilters({
  categories = [],
  brands = [],
  className = ""
}: AdvancedSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStock, setInStock] = useState<boolean>(false);
  const [onSale, setOnSale] = useState<boolean>(false);
  const [freeShipping, setFreeShipping] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("relevance");

  // Initialize filters from URL params
  useEffect(() => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const categories = searchParams.get('categories');
    const brands = searchParams.get('brands');
    const rating = searchParams.get('rating');
    const stock = searchParams.get('inStock');
    const sale = searchParams.get('onSale');
    const shipping = searchParams.get('freeShipping');
    const sort = searchParams.get('sortBy');

    if (minPrice && maxPrice) {
      setPriceRange([parseFloat(minPrice), parseFloat(maxPrice)]);
    }
    if (categories) {
      setSelectedCategories(categories.split(','));
    }
    if (brands) {
      setSelectedBrands(brands.split(','));
    }
    if (rating) {
      setMinRating(parseInt(rating));
    }
    if (stock) {
      setInStock(stock === 'true');
    }
    if (sale) {
      setOnSale(sale === 'true');
    }
    if (shipping) {
      setFreeShipping(shipping === 'true');
    }
    if (sort) {
      setSortBy(sort);
    }
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Price range
    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    
    // Categories
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    } else {
      params.delete('categories');
    }
    
    // Brands
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    } else {
      params.delete('brands');
    }
    
    // Rating
    if (minRating > 0) {
      params.set('rating', minRating.toString());
    } else {
      params.delete('rating');
    }
    
    // Stock
    if (inStock) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }
    
    // Sale
    if (onSale) {
      params.set('onSale', 'true');
    } else {
      params.delete('onSale');
    }
    
    // Shipping
    if (freeShipping) {
      params.set('freeShipping', 'true');
    } else {
      params.delete('freeShipping');
    }
    
    // Sort
    params.set('sortBy', sortBy);
    
    // Reset to first page
    params.set('page', '1');
    
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinRating(0);
    setInStock(false);
    setOnSale(false);
    setFreeShipping(false);
    setSortBy('relevance');
    
    // Clear URL params except search query
    const search = searchParams.get('search');
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    router.push(`/products?${params.toString()}`);
  };

  const toggleCategory = (categorySlug: string) => {
    setSelectedCategories(prev => 
      prev.includes(categorySlug)
        ? prev.filter(c => c !== categorySlug)
        : [...prev, categorySlug]
    );
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => 
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  const activeFiltersCount = [
    selectedCategories.length,
    selectedBrands.length,
    minRating > 0 ? 1 : 0,
    inStock ? 1 : 0,
    onSale ? 1 : 0,
    freeShipping ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range
          </Label>
          <div className="space-y-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(priceRange[0])}</span>
              <span>{formatCurrency(priceRange[1])}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => toggleCategory(category.slug)}
                  />
                  <Label
                    htmlFor={`category-${category.slug}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {category.name}
                    <span className="text-muted-foreground ml-1">
                      ({category._count.products})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Brands */}
        {brands.length > 0 && (
          <div className="space-y-3">
            <Label>Brands</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.name}`}
                    checked={selectedBrands.includes(brand.name)}
                    onCheckedChange={() => toggleBrand(brand.name)}
                  />
                  <Label
                    htmlFor={`brand-${brand.name}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {brand.name}
                    <span className="text-muted-foreground ml-1">
                      ({brand.count})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Rating */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Minimum Rating
          </Label>
          <div className="space-y-2">
            <Slider
              value={[minRating]}
              onValueChange={(value) => setMinRating(value[0])}
              max={5}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Any</span>
              <span>{minRating}+ stars</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Filters */}
        <div className="space-y-3">
          <Label>Additional Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={inStock}
                onCheckedChange={(checked) => setInStock(checked as boolean)}
              />
              <Label htmlFor="inStock" className="cursor-pointer text-sm">
                In Stock Only
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onSale"
                checked={onSale}
                onCheckedChange={(checked) => setOnSale(checked as boolean)}
              />
              <Label htmlFor="onSale" className="cursor-pointer text-sm">
                On Sale
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="freeShipping"
                checked={freeShipping}
                onCheckedChange={(checked) => setFreeShipping(checked as boolean)}
              />
              <Label htmlFor="freeShipping" className="cursor-pointer text-sm">
                Free Shipping
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-3">
          <Label>Sort By</Label>
          <div className="space-y-2">
            {[
              { value: 'relevance', label: 'Relevance' },
              { value: 'price-asc', label: 'Price: Low to High' },
              { value: 'price-desc', label: 'Price: High to Low' },
              { value: 'rating', label: 'Highest Rated' },
              { value: 'newest', label: 'Newest First' },
              { value: 'popular', label: 'Most Popular' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`sort-${option.value}`}
                  name="sortBy"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor={`sort-${option.value}`} className="cursor-pointer text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          {activeFiltersCount > 0 && (
            <Button onClick={clearFilters} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
