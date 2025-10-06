// Validation Schemas Barrel Export
// Re-export all Zod schemas for clean imports

// Product validations
export {
  productSchema,
  productCategorySchema,
  productVariantSchema,
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "../schemas/product-schema";

export type {
  Product,
  ProductCategory,
  ProductVariant,
  CreateProduct,
  UpdateProduct,
  ProductFilter,
} from "../schemas/product-schema";

// User validations
export {
  userSchema,
  addressSchema,
  registerUserSchema,
  loginUserSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/user-schema";

export type {
  User,
  Address,
  RegisterUser,
  LoginUser,
  UpdateUserProfile,
  ChangePassword,
  CreateAddress,
  UpdateAddress,
} from "../schemas/user-schema";

// Order validations
export {
  orderSchema,
  orderItemSchema,
  shippingAddressSchema,
  paymentDetailsSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  orderFilterSchema,
} from "../schemas/order-schema";

export type {
  Order,
  OrderItem,
  ShippingAddress,
  PaymentDetails,
  CreateOrder,
  UpdateOrderStatus,
  OrderFilter,
} from "../schemas/order-schema";

