import { z } from "zod";

// Product Category Schema
export const productCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Category slug is required"),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Product Schema
export const productSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  slug: z.string().min(1, "Product slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().max(300, "Short description too long").optional(),

  // Pricing
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0, "Compare price must be positive").optional(),
  cost: z.number().min(0, "Cost must be positive").optional(),

  // Inventory
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  quantity: z.number().int().min(0, "Quantity must be non-negative").default(0),
  allowBackorder: z.boolean().default(false),

  // Organization
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  vendor: z.string().optional(),
  brand: z.string().optional(),

  // Media
  images: z.array(z.string().url()).default([]),
  featuredImage: z.string().url().optional(),

  // Physical properties
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),

  // Status
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  publishedAt: z.date().optional(),
});

// Product Variant Schema
export const productVariantSchema = z.object({
  id: z.string().min(1, "Variant ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0, "Compare price must be positive").optional(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").default(0),
  image: z.string().url().optional(),
  options: z.record(z.string(), z.string()).default({}), // e.g., { color: 'red', size: 'M' }
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Product Form Schema (for frontend forms)
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// Update Product Form Schema
export const updateProductSchema = productSchema
  .partial()
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    updatedAt: z.date().default(() => new Date()),
  });

// Product Filter Schema (for search/filtering)
export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  brand: z.string().optional(),
  vendor: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Type exports
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
