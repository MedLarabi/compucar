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
  ImageIcon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

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
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain?: boolean;
  }>;
}

export interface VariantOption {
  id: string;
  name: string; // e.g., "Color", "Size", "Material"
  values: VariantOptionValue[]; // Enhanced to include images and prices
}

export interface VariantOptionValue {
  id: string;
  value: string; // e.g., "Red", "Large", "Cotton"
  price?: number; // Optional price modifier for this option value
  compareAtPrice?: number; // Optional compare at price
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    isMain?: boolean;
  }>; // Optional images specific to this option value
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

    const newOptionValue: VariantOptionValue = {
      id: `value-${Date.now()}-${Math.random()}`,
      value: value.trim(),
      price: undefined,
      compareAtPrice: undefined,
      images: [],
    };

    const updatedOptions = variantOptions.map(option =>
      option.id === optionId
        ? { ...option, values: [...option.values, newOptionValue] }
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
    const combinations: Array<{
      options: Record<string, string>;
      combinedPrice?: number;
      combinedCompareAtPrice?: number;
      combinedImages: Array<{
        id: string;
        url: string;
        alt?: string;
        isMain?: boolean;
      }>;
    }> = [];
    
    const generateCombinations = (index: number, currentData: {
      options: Record<string, string>;
      combinedPrice?: number;
      combinedCompareAtPrice?: number;
      combinedImages: Array<{
        id: string;
        url: string;
        alt?: string;
        isMain?: boolean;
      }>;
    }) => {
      if (index === optionsWithValues.length) {
        combinations.push({ ...currentData });
        return;
      }

      const option = optionsWithValues[index];
      option.values.forEach(valueObj => {
        const newData = {
          options: {
            ...currentData.options,
            [option.name]: valueObj.value,
          },
          combinedPrice: (currentData.combinedPrice || 0) + (valueObj.price || 0),
          combinedCompareAtPrice: currentData.combinedCompareAtPrice || valueObj.compareAtPrice,
          combinedImages: [
            ...currentData.combinedImages,
            ...(valueObj.images || [])
          ],
        };
        
        generateCombinations(index + 1, newData);
      });
    };

    generateCombinations(0, { 
      options: {}, 
      combinedPrice: 0, 
      combinedCompareAtPrice: undefined,
      combinedImages: [] 
    });

    // Create variants for combinations that don't already exist
    const existingCombinations = variants.map(v => JSON.stringify(v.options));
    const newVariants: ProductVariant[] = [];

    combinations.forEach(combination => {
      const combinationStr = JSON.stringify(combination.options);
      if (!existingCombinations.includes(combinationStr)) {
        const variantName = Object.values(combination.options).join(" / ");
        newVariants.push({
          id: `variant-${Date.now()}-${Math.random()}`,
          name: variantName,
          options: combination.options,
          isActive: true,
          quantity: 0,
          price: combination.combinedPrice || 0,
          compareAtPrice: combination.combinedCompareAtPrice,
          images: combination.combinedImages,
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

  // Handle variant image upload
  const handleVariantImageUpload = async (variantId: string, files: FileList) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const currentImages = variant.images || [];
    if (currentImages.length + validImages.length > 5) {
      toast.error("Maximum 5 images allowed per variant");
      return;
    }

    for (const file of validImages) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error(`Image ${file.name} is too large (max 4MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        const response = await fetch('/api/upload/basic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log('Variant image upload API response:', result); // Debug logging
        
        // Handle the API response structure: { success: true, file: { url, name, ... } }
        const uploadedFile = result.file || result;
        const imageUrl = uploadedFile.url || result.url;
        
        console.log('Extracted variant image URL:', imageUrl); // Debug logging
        
        // Validate that we got a valid URL
        if (!imageUrl || imageUrl.trim() === '') {
          toast.error(`Failed to get valid URL for ${file.name}`);
          continue;
        }
        
        const newImage = {
          id: `variant-image-${Date.now()}-${Math.random()}`,
          url: imageUrl.trim(),
          alt: file.name,
          isMain: currentImages.length === 0,
        };

        const updatedImages = [...currentImages, newImage];
        updateVariant(variantId, { images: updatedImages });
        
        toast.success(`Image uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  // Remove variant image
  const removeVariantImage = (variantId: string, imageId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant || !variant.images) return;

    const updatedImages = variant.images.filter(img => img.id !== imageId);
    
    // If we removed the main image, make the first remaining image main
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
      updatedImages[0].isMain = true;
    }
    
    updateVariant(variantId, { images: updatedImages });
  };

  // Set variant image as main
  const setVariantImageAsMain = (variantId: string, imageId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant || !variant.images) return;

    const updatedImages = variant.images.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }));
    
    updateVariant(variantId, { images: updatedImages });
  };

  // Update option value (price, images, etc.)
  const updateOptionValue = (optionId: string, valueIndex: number, updates: Partial<VariantOptionValue>) => {
    const updatedOptions = variantOptions.map(option =>
      option.id === optionId
        ? {
            ...option,
            values: option.values.map((value, index) =>
              index === valueIndex ? { ...value, ...updates } : value
            )
          }
        : option
    );

    onVariantOptionsChange(updatedOptions);
  };

  // Handle option value image upload
  const handleOptionValueImageUpload = async (optionId: string, valueIndex: number, files: FileList) => {
    const fileArray = Array.from(files);
    const validImages = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validImages.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    const option = variantOptions.find(opt => opt.id === optionId);
    if (!option || !option.values[valueIndex]) return;

    const currentImages = option.values[valueIndex].images || [];
    if (currentImages.length + validImages.length > 5) {
      toast.error("Maximum 5 images allowed per option value");
      return;
    }

    for (const file of validImages) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error(`Image ${file.name} is too large (max 4MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        const response = await fetch('/api/upload/basic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        console.log('Option value image upload API response:', result); // Debug logging
        
        // Handle the API response structure: { success: true, file: { url, name, ... } }
        const uploadedFile = result.file || result;
        const imageUrl = uploadedFile.url || result.url;
        
        console.log('Extracted option value image URL:', imageUrl); // Debug logging
        
        // Validate that we got a valid URL
        if (!imageUrl || imageUrl.trim() === '') {
          toast.error(`Failed to get valid URL for ${file.name}`);
          continue;
        }
        
        const newImage = {
          id: `option-image-${Date.now()}-${Math.random()}`,
          url: imageUrl.trim(),
          alt: file.name,
          isMain: currentImages.length === 0,
        };

        const updatedImages = [...currentImages, newImage];
        updateOptionValue(optionId, valueIndex, { images: updatedImages });
        
        toast.success(`Image uploaded successfully`);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  // Remove option value image
  const removeOptionValueImage = (optionId: string, valueIndex: number, imageId: string) => {
    const option = variantOptions.find(opt => opt.id === optionId);
    if (!option || !option.values[valueIndex] || !option.values[valueIndex].images) return;

    const updatedImages = option.values[valueIndex].images!.filter(img => img.id !== imageId);
    
    // If we removed the main image, make the first remaining image main
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isMain)) {
      updatedImages[0].isMain = true;
    }
    
    updateOptionValue(optionId, valueIndex, { images: updatedImages });
  };

  // Set option value image as main
  const setOptionValueImageAsMain = (optionId: string, valueIndex: number, imageId: string) => {
    const option = variantOptions.find(opt => opt.id === optionId);
    if (!option || !option.values[valueIndex] || !option.values[valueIndex].images) return;

    const updatedImages = option.values[valueIndex].images!.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }));
    
    updateOptionValue(optionId, valueIndex, { images: updatedImages });
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
                <div className="space-y-4">
                  {/* Existing Values */}
                  {option.values.map((valueObj, index) => (
                    <Card key={valueObj.id} className="border-muted/50">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Value Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{valueObj.value}</Badge>
                              {valueObj.price && valueObj.price > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  +${valueObj.price}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOptionValue(option.id, index)}
                              disabled={disabled}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium">Price Modifier ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={valueObj.price || ""}
                                onChange={(e) =>
                                  updateOptionValue(option.id, index, {
                                    price: e.target.value ? parseFloat(e.target.value) : undefined,
                                  })
                                }
                                disabled={disabled}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Compare at Price ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={valueObj.compareAtPrice || ""}
                                onChange={(e) =>
                                  updateOptionValue(option.id, index, {
                                    compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                                  })
                                }
                                disabled={disabled}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Images Section */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                Images
                              </Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleOptionValueImageUpload(option.id, index, e.target.files);
                                      e.target.value = ''; // Reset input
                                    }
                                  }}
                                  className="hidden"
                                  id={`option-images-${option.id}-${index}`}
                                  disabled={disabled}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.getElementById(`option-images-${option.id}-${index}`) as HTMLInputElement;
                                    input?.click();
                                  }}
                                  disabled={disabled || (valueObj.images?.length || 0) >= 5}
                                  className="h-6 text-xs"
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>

                            {/* Image Grid */}
                            {valueObj.images && valueObj.images.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {valueObj.images.filter(image => image.url && image.url.trim() !== '').map((image) => (
                                  <div key={image.id} className="relative group">
                                    <div className="aspect-square relative bg-muted rounded overflow-hidden">
                                      <Image
                                        src={image.url}
                                        alt={image.alt || "Option image"}
                                        fill
                                        className="object-cover"
                                      />
                                      {image.isMain && (
                                        <div className="absolute top-1 left-1">
                                          <Badge variant="default" className="text-xs h-4">
                                            Main
                                          </Badge>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          {!image.isMain && (
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              className="h-5 w-5 p-0"
                                              onClick={() => setOptionValueImageAsMain(option.id, index, image.id)}
                                              disabled={disabled}
                                              title="Set as main image"
                                            >
                                              <ImageIcon className="h-2 w-2" />
                                            </Button>
                                          )}
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            onClick={() => removeOptionValueImage(option.id, index, image.id)}
                                            disabled={disabled}
                                            title="Remove image"
                                          >
                                            <X className="h-2 w-2" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground border border-dashed rounded">
                                <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">No images</p>
                              </div>
                            )}
                            
                            {valueObj.images && valueObj.images.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {valueObj.images.length}/5 images
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

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
                        ?.suggestions?.filter(suggestion => !option.values.some(v => v.value === suggestion))
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

                    {/* Variant Images Section */}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Variant Images
                        </Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                handleVariantImageUpload(variant.id, e.target.files);
                                e.target.value = ''; // Reset input
                              }
                            }}
                            className="hidden"
                            id={`variant-images-${variant.id}`}
                            disabled={disabled}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`variant-images-${variant.id}`) as HTMLInputElement;
                              input?.click();
                            }}
                            disabled={disabled || (variant.images?.length || 0) >= 5}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Add Images
                          </Button>
                        </div>
                      </div>

                      {/* Image Grid */}
                      {variant.images && variant.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                          {variant.images.filter(image => image.url && image.url.trim() !== '').map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                                <Image
                                  src={image.url}
                                  alt={image.alt || "Variant image"}
                                  fill
                                  className="object-cover"
                                />
                                {image.isMain && (
                                  <div className="absolute top-2 left-2">
                                    <Badge variant="default" className="text-xs">
                                      Main
                                    </Badge>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    {!image.isMain && (
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setVariantImageAsMain(variant.id, image.id)}
                                        disabled={disabled}
                                        title="Set as main image"
                                      >
                                        <ImageIcon className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => removeVariantImage(variant.id, image.id)}
                                      disabled={disabled}
                                      title="Remove image"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No images uploaded for this variant</p>
                          <p className="text-xs">Add custom images to showcase this specific variant</p>
                        </div>
                      )}
                      
                      {variant.images && variant.images.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {variant.images.length}/5 images uploaded
                        </p>
                      )}
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
