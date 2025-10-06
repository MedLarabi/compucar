// Global Type Definitions

import type {
  CreateProduct,
  Product,
  ProductCategory,
  ProductFilter,
  ProductVariant,
  UpdateProduct,
} from "../schemas/product-schema";

import type {
  Address,
  LoginUser,
  RegisterUser,
  UpdateUserProfile,
  User,
} from "../schemas/user-schema";

import type {
  CreateOrder,
  Order,
  OrderFilter,
  OrderItem,
  PaymentDetails,
  ShippingAddress,
} from "../schemas/order-schema";

// Re-export schema types
export type {
  // Product types
  Product,
  ProductCategory,
  ProductVariant,
  CreateProduct,
  UpdateProduct,
  ProductFilter,

  // User types
  User,
  Address,
  RegisterUser,
  LoginUser,
  UpdateUserProfile,

  // Order types
  Order,
  OrderItem,
  CreateOrder,
  OrderFilter,
  ShippingAddress,
  PaymentDetails,
};

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common UI types
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FilterOption {
  name: string;
  value: string;
  count?: number;
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

// Search types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
  sortBy?: "name" | "price" | "date" | "popularity";
  sortOrder?: "asc" | "desc";
}

// Component prop types
export interface BaseComponent {
  className?: string;
  children?: React.ReactNode;
}

export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}
