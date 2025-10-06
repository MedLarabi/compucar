import { z } from "zod";

// Order Item Schema
export const orderItemSchema = z.object({
  id: z.string().min(1, "Order item ID is required"),
  orderId: z.string().min(1, "Order ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  image: z.string().url().optional(),
  variant: z.string().optional(), // e.g., "Red, Size M"
});

// Shipping Address Schema (embedded in order)
export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().optional(),
});

// Payment Details Schema
export const paymentDetailsSchema = z.object({
  method: z.enum(["card", "paypal", "apple_pay", "google_pay", "bank_transfer"]),
  status: z
    .enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"])
    .default("PENDING"),
  transactionId: z.string().optional(),
  gatewayId: z.string().optional(), // Stripe payment intent ID, etc.
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters").default("DZD"),
  paidAt: z.date().optional(),
  refundedAt: z.date().optional(),
  refundAmount: z.number().min(0).optional(),
});

// Order Schema
export const orderSchema = z.object({
  id: z.string().min(1, "Order ID is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  userId: z.string().min(1, "User ID is required"),

  // Order Status
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    .default("PENDING"),

  // Items
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),

  // Pricing
  subtotal: z.number().min(0, "Subtotal must be positive"),
  shipping: z.number().min(0, "Shipping must be positive").default(0),
  tax: z.number().min(0, "Tax must be positive").default(0),
  discount: z.number().min(0, "Discount must be positive").default(0),
  total: z.number().min(0, "Total must be positive"),

  // Addresses
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),

  // Payment
  payment: paymentDetailsSchema,

  // Shipping
  shippingMethod: z.string().min(1, "Shipping method is required"),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.date().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional(),

  // Notes
  customerNotes: z.string().max(500, "Notes too long").optional(),
  adminNotes: z.string().max(1000, "Admin notes too long").optional(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Create Order Schema (for checkout)
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Order must have at least one item"),

  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  shippingMethod: z.string().min(1, "Shipping method is required"),
  paymentMethod: z.enum(["card", "paypal", "apple_pay", "google_pay", "bank_transfer"]),
  customerNotes: z.string().max(500, "Notes too long").optional(),

  // Coupon/Discount
  couponCode: z.string().optional(),
});

// Update Order Status Schema
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  trackingNumber: z.string().optional(),
  adminNotes: z.string().max(1000, "Admin notes too long").optional(),
});

// Order Filter Schema (for admin)
export const orderFilterSchema = z.object({
  search: z.string().optional(), // search by order number, customer name, email
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    .optional(),
  userId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional(),
  paymentStatus: z
    .enum(["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"])
    .optional(),
  sortBy: z.enum(["orderNumber", "total", "createdAt", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Type exports
export type OrderItem = z.infer<typeof orderItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type PaymentDetails = z.infer<typeof paymentDetailsSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type OrderFilter = z.infer<typeof orderFilterSchema>;
