"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  stockLevel: 'high' | 'low' | 'out';
  options: Record<string, string>;
  isActive: boolean;
  images?: Array<{
    id: string;
    url: string;
    altText?: string;
    isMain?: boolean;
  }>;
}

interface VariantOption {
  name: string;
  values: string[];
}

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  defaultPrice: number;
  defaultCompareAtPrice?: number;
  onVariantChange?: (variant: ProductVariant | null) => void;
  onPriceChange?: (price: number, compareAtPrice?: number) => void;
  onImagesChange?: (images: any[]) => void;
}

export function ProductVariantSelector({
  variants,
  defaultPrice,
  defaultCompareAtPrice,
  onVariantChange,
  onPriceChange,
  onImagesChange,
}: ProductVariantSelectorProps) {
  const { t } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Extract variant options from variants
  const variantOptions: VariantOption[] = React.useMemo(() => {
    const optionsMap = new Map<string, Set<string>>();

    variants.forEach(variant => {
      Object.entries(variant.options).forEach(([key, value]) => {
        if (!optionsMap.has(key)) {
          optionsMap.set(key, new Set());
        }
        optionsMap.get(key)!.add(value);
      });
    });

    return Array.from(optionsMap.entries()).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet),
    }));
  }, [variants]);

  // Find matching variant based on selected options
  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0) {
      setSelectedVariant(null);
      onVariantChange?.(null);
      onPriceChange?.(defaultPrice, defaultCompareAtPrice);
      onImagesChange?.([]);
      return;
    }

    const matchingVariant = variants.find(variant => {
      return Object.entries(selectedOptions).every(([key, value]) => {
        return variant.options[key] === value;
      });
    });

    setSelectedVariant(matchingVariant || null);
    onVariantChange?.(matchingVariant || null);
    
    if (matchingVariant) {
      onPriceChange?.(matchingVariant.price, matchingVariant.compareAtPrice);
      onImagesChange?.(matchingVariant.images || []);
    } else {
      onPriceChange?.(defaultPrice, defaultCompareAtPrice);
      onImagesChange?.([]);
    }
  }, [selectedOptions, variants, defaultPrice, defaultCompareAtPrice]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => {
      const currentValue = prev[optionName];
      
      // If clicking the same option, deselect it
      if (currentValue === value) {
        const newOptions = { ...prev };
        delete newOptions[optionName];
        return newOptions;
      }
      
      // Otherwise, select the new option
      return {
        ...prev,
        [optionName]: value,
      };
    });
  };

  const isOptionAvailable = (optionName: string, value: string) => {
    const testOptions = { ...selectedOptions, [optionName]: value };
    
    return variants.some(variant => {
      return Object.entries(testOptions).every(([key, val]) => {
        return variant.options[key] === val;
      }) && variant.isActive && variant.inStock;
    });
  };

  if (variants.length === 0) {
    return null;
  }

  const handleResetSelection = () => {
    setSelectedOptions({});
    setSelectedVariant(null);
    onVariantChange?.(null);
    onPriceChange?.(defaultPrice, defaultCompareAtPrice);
    onImagesChange?.([]);
  };

  const hasAnySelection = Object.keys(selectedOptions).length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Reset Button - Show when any option is selected */}
      {hasAnySelection && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetSelection}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('product.resetSelection')}
          </Button>
        </div>
      )}

      {variantOptions.map((option) => (
        <div key={option.name} className="variant-option-group">
          {/* Mobile-optimized label */}
          <div 
            className="text-base sm:text-sm font-bold mb-3 sm:mb-4 uppercase tracking-wide leading-tight" 
            style={{ 
              color: '#111827',
              fontSize: '15px',
              fontWeight: '700'
            }}
          >
            {option.name}
            {selectedOptions[option.name] && (
              <span className="ml-2 text-gray-600 dark:text-gray-400 font-normal text-sm">
                ({selectedOptions[option.name]})
              </span>
            )}
          </div>
          
          {/* Mobile-optimized button grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const isAvailable = isOptionAvailable(option.name, value);
              
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleOptionSelect(option.name, value)}
                  disabled={!isAvailable}
                  className={cn(
                    "transition-all w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-auto text-xs sm:text-sm font-medium touch-manipulation whitespace-normal text-center leading-tight py-3 px-3",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="break-words w-full block">
                    {value}
                    {!isAvailable && (
                      <span className="ml-1 text-xs opacity-70 block sm:inline">(Out of Stock)</span>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Variant Info - Mobile Optimized */}
      {selectedVariant && (
        <Card className="bg-muted/50 shadow-sm">
          <CardContent className="p-3 sm:p-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {selectedVariant.name}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base sm:text-sm text-primary">
                    {formatPrice(selectedVariant.price)}
                  </span>
                  {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(selectedVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
                <Badge 
                  variant={selectedVariant.inStock ? "secondary" : "destructive"} 
                  className="text-xs px-2 py-0.5 font-medium"
                >
                  {selectedVariant.inStock 
                    ? `${selectedVariant.stockLevel === 'high' ? 'In stock' : 'Limited stock'}` 
                    : "Out of stock"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message if no complete selection - Mobile Optimized */}
      {variantOptions.length > 0 && Object.keys(selectedOptions).length < variantOptions.length && (
        <div 
          className="text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-2.5"
          style={{
            fontSize: '14px',
            color: '#374151'
          }}
        >
          {t('product.selectAllOptions')}
        </div>
      )}
    </div>
  );
}
