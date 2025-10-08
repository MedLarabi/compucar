"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { BasicProductMediaUpload } from "@/components/uploads/basic-product-media-upload";
import { VirtualProductFileUpload } from "@/components/uploads/virtual-product-file-upload";
import { VimeoVideoManager } from "@/components/admin/vimeo-video-manager";
import { ProductVariants, ProductVariant, VariantOption } from "@/components/admin/product-variants";
import { X, Plus, Save, FileText, Loader2, Package, DollarSign, Settings, Eye, Warehouse, Image, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define image interface
interface ProductImageData {
  id: string;
  url: string;
  alt?: string;
  isMain: boolean;
}

// Define video interface
interface ProductVideoData {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: string;
  mimeType?: string;
  isMain: boolean;
}

// Enhanced form schema with proper types
const enhancedProductFormSchema = z.object({
  // Required fields
  name: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.union([z.string(), z.number()]).optional(),
  categoryId: z.string().min(1, "Category is required"),
  
  // Optional basic fields
  shortDescription: z.string().max(500, "Short description too long").optional(),
  compareAtPrice: z.number().optional(),
  cost: z.number().optional(),
  
  // Optional inventory fields
  sku: z.string().max(100, "SKU too long").optional(),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  trackQuantity: z.boolean().default(true),
  lowStockThreshold: z.number().optional(),
  
  // Optional metadata
  brand: z.string().max(100, "Brand name too long").optional(),
  tags: z.array(z.string()).default([]),
  weight: z.number().optional(),
  dimensions: z.string().max(200, "Dimensions too long").optional(),
  
  // Status fields
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  
  // Virtual product fields
  isVirtual: z.boolean().default(false),
  downloadUrl: z.string().optional(),
  // Download limits removed - all downloads are unlimited // days
  licenseKey: z.string().optional(),
  systemRequirements: z.string().optional(),
  version: z.string().optional(),
  fileSize: z.string().optional(),
  
  // SEO fields
  metaTitle: z.string().max(60, "Meta title too long").optional(),
  metaDescription: z.string().max(160, "Meta description too long").optional(),
  
  // Media and variants
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    alt: z.string().optional(),
    isMain: z.boolean(),
  })).default([]),
  videos: z.array(z.object({
    id: z.string(),
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    duration: z.number().optional(),
    fileSize: z.string().optional(),
    mimeType: z.string().optional(),
    isMain: z.boolean(),
  })).default([]),
  variants: z.array(z.any()).default([]),
  variantOptions: z.array(z.any()).default([]),
});

type EnhancedProductFormData = z.infer<typeof enhancedProductFormSchema>;

interface EnhancedProductFormProps {
  onSubmit: (data: EnhancedProductFormData, isDraft?: boolean) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  loading?: boolean;
  defaultValues?: Partial<EnhancedProductFormData>;
}

export function EnhancedProductForm({
  onSubmit,
  categories,
  loading = false,
  defaultValues,
}: EnhancedProductFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);

  const form = useForm<EnhancedProductFormData>({
    resolver: zodResolver(enhancedProductFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      price: undefined,
      compareAtPrice: undefined,
      cost: undefined,
      categoryId: "",
      sku: "",
      quantity: 0,
      trackQuantity: true,
      lowStockThreshold: undefined,
      brand: "",
      tags: [],
      weight: undefined,
      dimensions: "",
      isActive: true,
      isFeatured: false,
      isDigital: false,
      requiresShipping: true,
      isVirtual: false,
      downloadUrl: "",
      licenseKey: "",
      systemRequirements: "",
      version: "",
      fileSize: "",
      metaTitle: "",
      metaDescription: "",
      images: [],
      videos: [],
      variants: [],
      variantOptions: [],
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...form.getValues(),
        ...defaultValues,
        images: defaultValues.images || [],
        videos: defaultValues.videos || [],
        variants: defaultValues.variants || [],
        variantOptions: defaultValues.variantOptions || [],
      });
      setVariants(defaultValues.variants || []);
      setVariantOptions(defaultValues.variantOptions || []);
    }
  }, [defaultValues, form]);

  const handleSubmit = async (data: EnhancedProductFormData, isDraft: boolean = false) => {
    setIsSaving(true);
    try {
      // Debug logging for form data
      console.log("Form submission data:", {
        name: data.name,
        imagesCount: data.images ? data.images.length : 0,
        images: data.images,
        isDraft
      });

      // Add variants to form data
      const formData = {
        ...data,
        variants,
        variantOptions,
        isDraft,
      };

      await onSubmit(formData, isDraft);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = form.formState.isValid;
  const hasRequiredFields = form.watch("name") && form.watch("description") && form.watch("categoryId");

  return (
    <div className="p-8">
      <Form {...form}>
        <form 
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            // Prevent default form submission - we handle it with buttons
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="basic" className="gap-2">
                <FileText className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <Image className="h-4 w-4" />
                Media
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <Warehouse className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="variants" className="gap-2">
                <Palette className="h-4 w-4" />
                Variants
              </TabsTrigger>
              <TabsTrigger value="virtual" className="gap-2">
                <Package className="h-4 w-4" />
                Virtual
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
                          <FormDescription>
                            A clear, descriptive name for your product
                          </FormDescription>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
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
                          <FormDescription>
                            Choose the primary category for this product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief product summary (optional)" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          A brief summary that appears in product listings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Description *</FormLabel>
                        <FormControl>
                          <TinyMCEEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Enter detailed product description..."
                            height={300}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed product description with formatting support
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Product brand (optional)" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormDescription>
                            The manufacturer or brand name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                placeholder="Press Enter to add tags"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value && !field.value.includes(value)) {
                                      field.onChange([...field.value, value]);
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                              <div className="flex flex-wrap gap-2">
                                {field.value.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="gap-1">
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTags = field.value.filter((_, i) => i !== index);
                                        field.onChange(newTags);
                                      }}
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Add tags to help customers find this product
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-8 p-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Product Media</h3>
                </div>

                <BasicProductMediaUpload
                  onImagesChange={(images) => {
                    const formattedImages = images.map(img => ({
                      id: img.id,
                      url: img.url,
                      alt: img.alt || "",
                      isMain: img.isMain || false,
                    }));
                    console.log("Setting form images:", formattedImages);
                    form.setValue("images", formattedImages);
                    console.log("Form images after setValue:", form.getValues("images"));
                  }}
                  onVideosChange={(videos) => {
                    const formattedVideos = videos.map(vid => ({
                      id: vid.id,
                      url: vid.url,
                      title: vid.title || "",
                      description: vid.description || "",
                      thumbnail: vid.thumbnail || "",
                      duration: vid.duration || 0,
                      fileSize: vid.fileSize || "",
                      mimeType: vid.mimeType || "",
                      isMain: vid.isMain || false,
                    }));
                    console.log("Setting form videos:", formattedVideos);
                    form.setValue("videos", formattedVideos);
                    console.log("Form videos after setValue:", form.getValues("videos"));
                  }}
                  existingImages={form.watch("images")?.map(img => ({
                    id: img.id,
                    url: img.url,
                    alt: img.alt || "",
                    isMain: img.isMain,
                  })) || []}
                  existingVideos={form.watch("videos")?.map(vid => ({
                    id: vid.id,
                    url: vid.url,
                    title: vid.title || "",
                    description: vid.description || "",
                    thumbnail: vid.thumbnail || "",
                    duration: vid.duration || 0,
                    fileSize: vid.fileSize || "",
                    mimeType: vid.mimeType || "",
                    isMain: vid.isMain,
                  })) || []}
                  maxImages={8}
                  maxVideos={3}
                />

                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                  <p className="font-medium mb-1">Upload Options:</p>
                  <p>• <strong>Basic Upload:</strong> Local file processing (default, no API keys needed)</p>
                  <p className="mt-2 text-blue-600">
                    ✅ Basic Upload is ready to use without any configuration
                  </p>
                </div>

                {/* Vimeo Video Manager Section */}
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Professional Video Hosting</h3>
                      <p className="text-sm text-muted-foreground">
                        Add Vimeo videos for professional, fast-loading video experience
                      </p>
                    </div>
                  </div>

                  <VimeoVideoManager
                    videos={form.watch("videos")?.map(vid => ({
                      id: vid.id,
                      url: vid.url,
                      title: vid.title,
                      thumbnail: vid.thumbnail,
                      duration: vid.duration,
                      videoType: vid.url?.includes('vimeo.com') ? 'VIMEO' as const : 'DIRECT' as const,
                      vimeoId: vid.url?.includes('vimeo.com') ? 
                        vid.url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)?.[1] : 
                        undefined
                    })) || []}
                    onAddVideo={async (videoData) => {
                      const currentVideos = form.getValues("videos") || [];
                      const newVideo = {
                        id: `vimeo-${Date.now()}`,
                        url: videoData.url,
                        title: videoData.title || "",
                        description: "",
                        thumbnail: "",
                        duration: 0,
                        fileSize: "",
                        mimeType: "video/mp4",
                        isMain: currentVideos.length === 0,
                      };
                      
                      const updatedVideos = [...currentVideos, newVideo];
                      form.setValue("videos", updatedVideos);
                      console.log("Added Vimeo video:", newVideo);
                      console.log("Updated videos:", updatedVideos);
                    }}
                    onRemoveVideo={async (videoId) => {
                      const currentVideos = form.getValues("videos") || [];
                      const updatedVideos = currentVideos.filter(v => v.id !== videoId);
                      form.setValue("videos", updatedVideos);
                      console.log("Removed video:", videoId);
                      console.log("Updated videos:", updatedVideos);
                    }}
                    isLoading={loading}
                  />
                </div>
              </div>
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
                          <FormLabel>Selling Price <span className="text-muted-foreground">(optional)</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="Leave empty for free product (e.g., 29.99)" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormDescription>
                            The price customers will pay. Defaults to free (0 DA) if not set.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compareAtPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Original price (for showing discounts)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost per Item</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Your cost (for profit calculations)
                          </FormDescription>
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
                          <FormControl>
                            <Input 
                              placeholder="Stock Keeping Unit (optional)" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for inventory tracking
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Available quantity in stock
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="trackQuantity"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Track Quantity</FormLabel>
                            <FormDescription>
                              Monitor stock levels for this product
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

                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Alert</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Alert threshold" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Get notified when stock is low
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Product weight for shipping calculations
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="L × W × H (optional)" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormDescription>
                            Product dimensions for shipping
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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

            {/* Virtual Product Tab */}
            <TabsContent value="virtual" className="space-y-8 p-1">
              <Card>
                <CardHeader>
                  <CardTitle>Virtual Product Settings</CardTitle>
                  <CardDescription>
                    Configure digital downloads and virtual product options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                  {/* Virtual Product Toggle */}
                  <FormField
                    control={form.control}
                    name="isVirtual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-6">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Virtual Product</FormLabel>
                          <FormDescription>
                            This is a digital product that will be available for download
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

                  {/* Virtual Product Fields - Only show when isVirtual is true */}
                  {form.watch("isVirtual") && (
                    <div className="space-y-6">
                      {/* File Upload */}
                      <FormField
                        control={form.control}
                        name="downloadUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product File</FormLabel>
                            <FormControl>
                              <VirtualProductFileUpload
                                value={field.value}
                                onChange={(url, fileInfo) => {
                                  field.onChange(url);
                                  if (fileInfo) {
                                    form.setValue("fileSize", fileInfo.size);
                                  }
                                }}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload the file that customers will download after purchase
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Note about unlimited downloads */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          <strong>Unlimited Downloads:</strong> All virtual products now have unlimited downloads with no expiry date.
                        </p>
                      </div>

                      {/* Product Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="version"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Version</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., v1.0.0"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Product version number (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fileSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File Size</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 25 MB"
                                  {...field}
                                  value={field.value || ""}
                                  readOnly
                                />
                              </FormControl>
                              <FormDescription>
                                Automatically detected from uploaded file
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* License Key */}
                      <FormField
                        control={form.control}
                        name="licenseKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Key Template</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., PROD-2024-XXXX-YYYY-ZZZZ"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Template for generating license keys (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* System Requirements */}
                      <FormField
                        control={form.control}
                        name="systemRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>System Requirements</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Windows 10/11, macOS 10.15+, Linux"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum system requirements for this software
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
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
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                              <FormDescription>
                                Product is visible to customers
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

                      <FormField
                        control={form.control}
                        name="isFeatured"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Featured</FormLabel>
                              <FormDescription>
                                Show in featured sections
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

                      <FormField
                        control={form.control}
                        name="isDigital"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Digital Product</FormLabel>
                              <FormDescription>
                                No physical shipping required
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
                  </div>

                  <Separator />

                  {/* SEO Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">SEO Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="SEO page title (optional)" 
                                maxLength={60}
                                {...field} 
                                value={field.value || ""} 
                              />
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
                            <FormLabel>SEO Description</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="SEO meta description (optional)" 
                                maxLength={160}
                                {...field} 
                                value={field.value || ""} 
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

      {/* Action Buttons */}
      <div className="border-t pt-8 pb-4 mt-8">
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
              variant="secondary"
              size="lg"
              onClick={() => handleSubmit(form.getValues(), true)}
              disabled={isSaving || loading || !hasRequiredFields}
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
              disabled={isSaving || loading || !isFormValid || !hasRequiredFields}
              type="button"
              className="min-w-[150px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
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
      </div>
    </div>
  );
}