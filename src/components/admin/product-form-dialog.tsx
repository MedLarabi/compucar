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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImageUpload } from "@/components/uploads/product-image-upload";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

// Form schema for product creation/editing
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().max(300, "Short description too long").optional(),
  
  // Pricing
  price: z.union([z.string(), z.number()]).optional(),
  compareAtPrice: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  cost: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),

  // Inventory
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  quantity: z.string().transform((val) => parseInt(val) || 0),
  allowBackorder: z.boolean().default(false),

  // Organization
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Physical properties
  weight: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  length: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  width: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
  height: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),

  // Status
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  
  // Images
  images: z.array(z.string()).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface Category {
  id: string;
  name: string;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  loading?: boolean;
  title: string;
  description: string;
  defaultValues?: any;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  categories,
  loading = false,
  title,
  description,
  defaultValues,
}: ProductFormDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
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
    },
  });

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
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
        images: defaultValues.images || [],
      });
    } else if (open && !defaultValues) {
      form.reset();
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (data: ProductFormData) => {
    const processedData = {
      ...data,
      price: Number(data.price),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
      cost: data.cost ? Number(data.cost) : null,
      quantity: Number(data.quantity),
      weight: data.weight ? Number(data.weight) : null,
      dimensions: (data.length || data.width || data.height) ? {
        length: data.length ? Number(data.length) : null,
        width: data.width ? Number(data.width) : null,
        height: data.height ? Number(data.height) : null,
      } : null,
      // Convert images array to the format expected by the API
      images: data.images.map((url, index) => ({
        url,
        alt: data.name,
        sortOrder: index,
      })),
    };

    onSubmit(processedData);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Information</CardTitle>
                      <CardDescription>
                        Basic product details and descriptions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
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
                              <FormLabel>Category</FormLabel>
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed product description"
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
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
                              <Textarea 
                                placeholder="Brief product summary"
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Used in product listings and search results
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand</FormLabel>
                              <FormControl>
                                <Input placeholder="Product brand" {...field} />
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
                                <Input placeholder="Product vendor" {...field} />
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
                              placeholder="Add a tag"
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

                <TabsContent value="images" className="space-y-4">
                  <ProductImageUpload
                    onImagesChange={(images) => form.setValue("images", images)}
                    existingImages={form.watch("images")}
                    maxImages={5}
                  />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing Information</CardTitle>
                      <CardDescription>
                        Set product pricing and cost details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
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

                <TabsContent value="inventory" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Management</CardTitle>
                      <CardDescription>
                        Manage stock levels and tracking
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="Enter SKU" {...field} />
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
                                <Input placeholder="Enter barcode" {...field} />
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
                          <div className="grid grid-cols-2 gap-4">
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

                <TabsContent value="advanced" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>
                        Additional product configuration options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Status and Visibility */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Status & Visibility</h4>
                        <div className="grid grid-cols-3 gap-4">
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
                        <div className="grid grid-cols-4 gap-4">
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
                                  <Input placeholder="SEO title (max 60 characters)" {...field} />
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
                                  <Textarea 
                                    placeholder="SEO description (max 160 characters)"
                                    className="min-h-[60px]"
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)} 
            disabled={loading}
          >
            {loading ? "Saving..." : defaultValues ? "Update Product" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
