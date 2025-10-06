"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TinyMCEEditor } from "@/components/ui/tinymce-editor";
import { AdvancedProductImageUpload } from "@/components/uploads/advanced-product-image-upload";
import { ProductVariants, ProductVariant, VariantOption } from "@/components/admin/product-variants";
import { X, Plus, Save, FileText, Loader2, Package, DollarSign, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Enhanced form schema with optional fields
const enhancedProductFormSchema = z.object({
  // Required fields
  name: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.union([z.string(), z.number()]).optional(),
  categoryId: z.string().min(1, "Category is required"),
  
  // Optional basic fields
  shortDescription: z.string().max(500, "Short description too long").optional(),
  compareAtPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  cost: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  
  // Optional inventory fields
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  quantity: z.string().transform((val) => parseInt(val) || 0),
  allowBackorder: z.boolean().default(false),

  // Optional organization fields
  brand: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Optional physical properties
  weight: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  length: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  width: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  height: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),

  // Status and visibility
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // Optional SEO fields
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  
  // Media and variants
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    alt: z.string().optional(),
    isMain: z.boolean().optional(),
  })).default([]),
  
  // Product variants
  variants: z.array(z.any()).default([]),
  variantOptions: z.array(z.any()).default([]),
});

type EnhancedProductFormData = z.infer<typeof enhancedProductFormSchema>;

interface Category {
  id: string;
  name: string;
}

interface EnhancedProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, isDraft?: boolean) => void;
  categories: Category[];
  loading?: boolean;
  title: string;
  description: string;
  defaultValues?: any;
}

export function EnhancedProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  loading = false,
  title,
  description,
  defaultValues,
}: EnhancedProductFormDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

  const form = useForm<EnhancedProductFormData>({
    resolver: zodResolver(enhancedProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: undefined,
      compareAtPrice: "",
      cost: "",
      sku: "",
      barcode: "",
      trackQuantity: true,
      quantity: "0",
      allowBackorder: false,
      categoryId: "",
      brand: "",
      vendor: "",
      tags: [],
      weight: "",
      length: "",
      width: "",
      height: "",
      status: "DRAFT",
      isActive: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      images: [],
      variants: [],
      variantOptions: [],
    },
  });

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open && defaultValues) {
      const formData = {
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        shortDescription: defaultValues.shortDescription || "",
        price: String(defaultValues.price || 0),
        compareAtPrice: defaultValues.compareAtPrice ? String(defaultValues.compareAtPrice) : "",
        cost: defaultValues.cost ? String(defaultValues.cost) : "",
        sku: defaultValues.sku || "",
        barcode: defaultValues.barcode || "",
        trackQuantity: defaultValues.trackQuantity ?? true,
        quantity: String(defaultValues.quantity || 0),
        allowBackorder: defaultValues.allowBackorder ?? false,
        categoryId: defaultValues.categoryId || "",
        brand: defaultValues.brand || "",
        vendor: defaultValues.vendor || "",
        tags: defaultValues.tags || [],
        weight: defaultValues.weight ? String(defaultValues.weight) : "",
        length: defaultValues.length ? String(defaultValues.length) : "",
        width: defaultValues.width ? String(defaultValues.width) : "",
        height: defaultValues.height ? String(defaultValues.height) : "",
        status: defaultValues.status || "DRAFT",
        isActive: defaultValues.isActive ?? true,
        isFeatured: defaultValues.isFeatured ?? false,
        metaTitle: defaultValues.metaTitle || "",
        metaDescription: defaultValues.metaDescription || "",
        images: defaultValues.images?.map((img: any, index: number) => ({
          id: img.id || `image-${index}`,
          url: img.url || img,
          alt: img.alt || img.altText,
          isMain: index === 0,
        })) || [],
        variants: [],
        variantOptions: [],
      };
      
      form.reset(formData);
      setVariants(defaultValues.variants || []);
      setVariantOptions(defaultValues.variantOptions || []);
    } else if (open && !defaultValues) {
      form.reset();
      setVariants([]);
      setVariantOptions([]);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (data: EnhancedProductFormData, isDraft: boolean = false) => {
    setIsSaving(true);
    
    try {
      // Process the data
      const processedData = {
        ...data,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
        cost: data.cost ? Number(data.cost) : null,
        quantity: Number(data.quantity),
        weight: data.weight ? Number(data.weight) : null,
        
        // Handle dimensions
        dimensions: (data.length || data.width || data.height) ? {
          length: data.length ? Number(data.length) : null,
          width: data.width ? Number(data.width) : null,
          height: data.height ? Number(data.height) : null,
        } : null,
        
        // Convert images to API format
        images: data.images.map((img, index) => ({
          url: img.url,
          alt: img.alt || data.name,
          sortOrder: index,
        })),
        
        // Add variants and variant options
        variants,
        variantOptions,
        
        // Set status based on save type
        status: isDraft ? "DRAFT" : (data.status || "ACTIVE"),
      };

      await onSubmit(processedData, isDraft);
      
      if (isDraft) {
        toast.success("Product saved as draft!");
      } else {
        toast.success(defaultValues ? "Product updated successfully!" : "Product created successfully!");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const generateSKU = () => {
    const name = form.getValues("name");
    const category = categories.find(c => c.id === form.getValues("categoryId"));
    
    if (name && category) {
      const prefix = category.name.substring(0, 3).toUpperCase();
      const namePart = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
      const sku = `${prefix}-${namePart}-${randomPart}`;
      form.setValue("sku", sku);
    }
  };

  const isFormValid = form.formState.isValid;
  const hasRequiredFields = form.watch("name") && form.watch("description") && form.watch("categoryId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-full max-h-[98vh] h-full overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          <Form {...form}>
            <form className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="basic" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="media" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="gap-2">
                    <Package className="h-4 w-4" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Variants
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-8 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Information</CardTitle>
                      <CardDescription>
                        Basic product details and descriptions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter product name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <TinyMCEEditor
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Enter detailed product description with formatting..."
                                height={250}
                              />
                            </FormControl>
                            <FormDescription>
                              Use the rich text editor to format your product description with headings, lists, links, and more.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Brief product summary for listings"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Used in product listings and search results (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand</FormLabel>
                              <FormControl>
                                <Input placeholder="Product brand (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vendor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor</FormLabel>
                              <FormControl>
                                <Input placeholder="Product vendor (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <FormLabel>Tags</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag (optional)"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" variant="outline" onClick={addTag}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {form.watch("tags").map((tag) => (
                              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-8 p-1">
                  <AdvancedProductImageUpload
                    onImagesChange={(images) => form.setValue("images", images)}
                    existingImages={form.watch("images")}
                    maxImages={8}
                  />
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-8 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing Information</CardTitle>
                      <CardDescription>
                        Set product pricing and cost details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($) <span className="text-muted-foreground">(optional)</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="text" 
                                  placeholder="Leave empty for free product (e.g., 29.99)"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compareAtPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compare at Price ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Original price for discount display</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Cost per unit for profit tracking</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="space-y-8 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Management</CardTitle>
                      <CardDescription>
                        Manage stock levels and tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="Enter SKU (optional)" {...field} />
                                </FormControl>
                                <Button type="button" variant="outline" onClick={generateSKU}>
                                  Generate
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="barcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Barcode</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter barcode (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="trackQuantity"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Track Quantity</FormLabel>
                                <FormDescription>
                                  Enable inventory tracking for this product
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch("trackQuantity") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="quantity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="allowBackorder"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Allow Backorder</FormLabel>
                                    <FormDescription>
                                      Allow sales when out of stock
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value="variants" className="space-y-8 p-1">
                  <ProductVariants
                    variants={variants}
                    onVariantsChange={setVariants}
                    variantOptions={variantOptions}
                    onVariantOptionsChange={setVariantOptions}
                  />
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-8 p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>
                        Additional product configuration options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 p-8">
                      {/* Status and Visibility */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Status & Visibility</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Active</FormLabel>
                                  <FormDescription>Visible in store</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Featured</FormLabel>
                                  <FormDescription>Highlight product</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Physical Properties */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Physical Properties</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (lbs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="length"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Length (in)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Width (in)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Height (in)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* SEO */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">SEO Settings</h4>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="metaTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="SEO title (max 60 characters, optional)" {...field} />
                                </FormControl>
                                <FormDescription>
                                  {field.value?.length || 0}/60 characters
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="metaDescription"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Meta Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="SEO description (max 160 characters, optional)"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  {field.value?.length || 0}/160 characters
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        <DialogFooter className="border-t pt-8 pb-4">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasRequiredFields ? (
                <span className="text-green-600">✓ All required fields completed</span>
              ) : (
                <span className="text-orange-600">⚠ Required fields: Name, Description, Category</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onOpenChange(false)} 
                disabled={isSaving}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => handleSubmit(form.getValues(), true)}
                disabled={isSaving || !hasRequiredFields}
                type="button"
                className="min-w-[130px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Draft...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              
              <Button 
                size="lg"
                onClick={() => handleSubmit(form.getValues(), false)}
                disabled={isSaving || !isFormValid || !hasRequiredFields}
                type="button"
                className="min-w-[150px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {defaultValues ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
