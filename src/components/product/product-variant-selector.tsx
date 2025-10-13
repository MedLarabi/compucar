"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

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
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value,
    }));
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

  return (
    <div className="space-y-6">
      {variantOptions.map((option) => (
        <div key={option.name}>
          <Label className="text-sm font-medium mb-3 block">
            {option.name}
            {selectedOptions[option.name] && (
              <span className="ml-2 text-muted-foreground">
                ({selectedOptions[option.name]})
              </span>
            )}
          </Label>
          
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              const isAvailable = isOptionAvailable(option.name, value);
              
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleOptionSelect(option.name, value)}
                  disabled={!isAvailable}
                  className={cn(
                    "transition-all",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {value}
                  {!isAvailable && (
                    <span className="ml-1 text-xs opacity-70">(Out of Stock)</span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedVariant.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">
                    {formatPrice(selectedVariant.price)}
                  </span>
                  {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(selectedVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedVariant.inStock ? "secondary" : "destructive"} className="text-xs px-2 py-0.5">
                    {selectedVariant.inStock 
                      ? `${selectedVariant.stockLevel === 'high' ? 'In stock' : 'Limited stock'}` 
                      : "Out of stock"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message if no complete selection */}
      {variantOptions.length > 0 && Object.keys(selectedOptions).length < variantOptions.length && (
        <p className="text-sm text-muted-foreground">
          Please select all options to see the final price and availability.
        </p>
      )}
    </div>
  );
}
