"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  X,
  Settings,
  Package,
  DollarSign,
  Hash,
  Palette,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  cost?: number;
  quantity?: number;
  weight?: number;
  options: Record<string, string>; // e.g., { "Color": "Red", "Size": "Large" }
  isActive: boolean;
}

export interface VariantOption {
  id: string;
  name: string; // e.g., "Color", "Size", "Material"
  values: string[]; // e.g., ["Red", "Blue", "Green"]
}

interface ProductVariantsProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  variantOptions: VariantOption[];
  onVariantOptionsChange: (options: VariantOption[]) => void;
  disabled?: boolean;
}

const COMMON_VARIANT_TYPES = [
  { value: "Color", icon: Palette, suggestions: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Purple"] },
  { value: "Size", icon: Ruler, suggestions: ["XS", "S", "M", "L", "XL", "XXL"] },
  { value: "Material", icon: Package, suggestions: ["Cotton", "Polyester", "Leather", "Metal", "Plastic", "Wood"] },
  { value: "Style", icon: Settings, suggestions: ["Classic", "Modern", "Vintage", "Sport", "Casual", "Formal"] },
];

export function ProductVariants({
  variants,
  onVariantsChange,
  variantOptions,
  onVariantOptionsChange,
  disabled = false,
}: ProductVariantsProps) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");

  // Add new variant option (e.g., Color, Size)
  const addVariantOption = (optionName: string) => {
    if (!optionName.trim()) return;

    const newOption: VariantOption = {
      id: `option-${Date.now()}`,
      name: optionName.trim(),
      values: [],
    };

    onVariantOptionsChange([...variantOptions, newOption]);
    setNewOptionName("");
  };

  // Add value to existing option
  const addOptionValue = (optionId: string, value: string) => {
    if (!value.trim()) return;

    const updatedOptions = variantOptions.map(option =>
      option.id === optionId
        ? { ...option, values: [...option.values, value.trim()] }
        : option
    );

    onVariantOptionsChange(updatedOptions);
    setNewOptionValue("");
  };

  // Remove option value
  const removeOptionValue = (optionId: string, valueIndex: number) => {
    const updatedOptions = variantOptions.map(option =>
      option.id === optionId
        ? { ...option, values: option.values.filter((_, index) => index !== valueIndex) }
        : option
    );

    onVariantOptionsChange(updatedOptions);

    // Remove this option from all variants
    const updatedVariants = variants.map(variant => {
      const optionName = variantOptions.find(opt => opt.id === optionId)?.name;
      if (optionName) {
        const { [optionName]: removed, ...restOptions } = variant.options;
        return { ...variant, options: restOptions };
      }
      return variant;
    });

    onVariantsChange(updatedVariants);
  };

  // Remove entire option
  const removeVariantOption = (optionId: string) => {
    const optionToRemove = variantOptions.find(opt => opt.id === optionId);
    if (!optionToRemove) return;

    const updatedOptions = variantOptions.filter(option => option.id !== optionId);
    onVariantOptionsChange(updatedOptions);

    // Remove this option from all variants
    const updatedVariants = variants.map(variant => {
      const { [optionToRemove.name]: removed, ...restOptions } = variant.options;
      return { ...variant, options: restOptions };
    });

    onVariantsChange(updatedVariants);
  };

  // Generate all possible variant combinations
  const generateVariants = () => {
    if (variantOptions.length === 0) return;

    const optionsWithValues = variantOptions.filter(option => option.values.length > 0);
    if (optionsWithValues.length === 0) return;

    // Generate all combinations
    const combinations: Record<string, string>[] = [];
    
    const generateCombinations = (index: number, currentCombination: Record<string, string>) => {
      if (index === optionsWithValues.length) {
        combinations.push({ ...currentCombination });
        return;
      }

      const option = optionsWithValues[index];
      option.values.forEach(value => {
        generateCombinations(index + 1, {
          ...currentCombination,
          [option.name]: value,
        });
      });
    };

    generateCombinations(0, {});

    // Create variants for combinations that don't already exist
    const existingCombinations = variants.map(v => JSON.stringify(v.options));
    const newVariants: ProductVariant[] = [];

    combinations.forEach(combination => {
      const combinationStr = JSON.stringify(combination);
      if (!existingCombinations.includes(combinationStr)) {
        const variantName = Object.values(combination).join(" / ");
        newVariants.push({
          id: `variant-${Date.now()}-${Math.random()}`,
          name: variantName,
          options: combination,
          isActive: true,
          quantity: 0,
        });
      }
    });

    if (newVariants.length > 0) {
      onVariantsChange([...variants, ...newVariants]);
    }
  };

  // Update variant
  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    const updatedVariants = variants.map(variant =>
      variant.id === variantId ? { ...variant, ...updates } : variant
    );
    onVariantsChange(updatedVariants);
  };

  // Remove variant
  const removeVariant = (variantId: string) => {
    const updatedVariants = variants.filter(variant => variant.id !== variantId);
    onVariantsChange(updatedVariants);
  };

  return (
    <div className="space-y-6">
      {/* Variant Options Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Variant Options
          </CardTitle>
          <CardDescription>
            Define the types of variants for this product (e.g., Color, Size, Material)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add Common Options */}
          <div>
            <Label className="text-sm font-medium">Quick Add</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COMMON_VARIANT_TYPES.map((type) => {
                const Icon = type.icon;
                const exists = variantOptions.some(opt => opt.name === type.value);
                return (
                  <Button
                    key={type.value}
                    variant={exists ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => !exists && addVariantOption(type.value)}
                    disabled={disabled || exists}
                    type="button"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {type.value}
                    {exists && <Badge variant="secondary" className="ml-1 text-xs">Added</Badge>}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Add Custom Option */}
          <div className="flex gap-2">
            <Input
              placeholder="Custom option name (e.g., Pattern, Finish)"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              onClick={() => addVariantOption(newOptionName)}
              disabled={disabled || !newOptionName.trim()}
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          {/* Existing Options */}
          {variantOptions.map((option) => (
            <Card key={option.id} className="border-muted">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium">{option.name}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariantOption(option.id)}
                    disabled={disabled}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Option Values */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {value}
                        <button
                          onClick={() => removeOptionValue(option.id, index)}
                          disabled={disabled}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Add Value */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add ${option.name.toLowerCase()} value`}
                      value={selectedOptionId === option.id ? newOptionValue : ""}
                      onChange={(e) => {
                        setSelectedOptionId(option.id);
                        setNewOptionValue(e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOptionValue(option.id, newOptionValue);
                        }
                      }}
                      disabled={disabled}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => addOptionValue(option.id, newOptionValue)}
                      disabled={disabled || !newOptionValue.trim() || selectedOptionId !== option.id}
                      type="button"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Quick suggestions */}
                  {COMMON_VARIANT_TYPES.find(type => type.value === option.name)?.suggestions && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {COMMON_VARIANT_TYPES
                        .find(type => type.value === option.name)
                        ?.suggestions?.filter(suggestion => !option.values.includes(suggestion))
                        .map(suggestion => (
                          <Button
                            key={suggestion}
                            variant="ghost"
                            size="sm"
                            onClick={() => addOptionValue(option.id, suggestion)}
                            disabled={disabled}
                            className="h-6 px-2 text-xs"
                            type="button"
                          >
                            + {suggestion}
                          </Button>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Generate Variants Button */}
          {variantOptions.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={generateVariants}
                disabled={disabled}
                type="button"
                className="w-full"
              >
                <Package className="h-4 w-4 mr-2" />
                Generate All Variant Combinations
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                This will create variants for all possible combinations of your options
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Variants */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Product Variants ({variants.length})
            </CardTitle>
            <CardDescription>
              Configure pricing, inventory, and other details for each variant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <Card key={variant.id} className="border-muted">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Variant Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{variant.name}</div>
                          <div className="flex gap-1 mt-1">
                            {Object.entries(variant.options).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${variant.id}`} className="text-sm">
                            Active
                          </Label>
                          <Switch
                            id={`active-${variant.id}`}
                            checked={variant.isActive}
                            onCheckedChange={(checked) =>
                              updateVariant(variant.id, { isActive: checked })
                            }
                            disabled={disabled}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                          disabled={disabled}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Variant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor={`sku-${variant.id}`} className="text-sm">
                          SKU
                        </Label>
                        <Input
                          id={`sku-${variant.id}`}
                          placeholder="Variant SKU"
                          value={variant.sku || ""}
                          onChange={(e) =>
                            updateVariant(variant.id, { sku: e.target.value })
                          }
                          disabled={disabled}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`price-${variant.id}`} className="text-sm">
                          Price ($)
                        </Label>
                        <Input
                          id={`price-${variant.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={variant.price || ""}
                          onChange={(e) =>
                            updateVariant(variant.id, {
                              price: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`compare-${variant.id}`} className="text-sm">
                          Compare at Price ($)
                        </Label>
                        <Input
                          id={`compare-${variant.id}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={variant.compareAtPrice || ""}
                          onChange={(e) =>
                            updateVariant(variant.id, {
                              compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`quantity-${variant.id}`} className="text-sm">
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${variant.id}`}
                          type="number"
                          placeholder="0"
                          value={variant.quantity || ""}
                          onChange={(e) =>
                            updateVariant(variant.id, {
                              quantity: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
