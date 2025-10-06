// Application Constants

// API Routes
export const API_ROUTES = {
  AUTH: "/api/auth",
  PRODUCTS: "/api/products",
  ORDERS: "/api/orders",
  USERS: "/api/users",
} as const;

// App Routes
export const APP_ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  CART: "/cart",
  CHECKOUT: "/checkout",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DASHBOARD: "/account",
  ADMIN: "/admin",
} as const;

// Product Categories
export const PRODUCT_CATEGORIES = {
  ELECTRONICS: "electronics",
  AUTOMOTIVE: "automotive",
  ACCESSORIES: "accessories",
  PARTS: "parts",
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: "card",
  PAYPAL: "paypal",
  APPLE_PAY: "apple_pay",
  GOOGLE_PAY: "google_pay",
  BANK_TRANSFER: "bank_transfer",
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SUPER_ADMIN: "super-admin",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

