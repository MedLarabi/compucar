import { z } from "zod";

// User Schema
export const userSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
    .optional(),

  // Avatar
  image: z.string().url().optional(),

  // Account status
  emailVerified: z.date().optional(),
  isActive: z.boolean().default(true),
  role: z.enum(["customer", "admin", "super-admin"]).default("customer"),

  // Preferences
  newsletter: z.boolean().default(false),
  marketing: z.boolean().default(false),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastLoginAt: z.date().optional(),
});

// Address Schema
export const addressSchema = z.object({
  id: z.string().min(1, "Address ID is required"),
  userId: z.string().min(1, "User ID is required"),
  type: z.enum(["shipping", "billing", "both"]).default("shipping"),
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  company: z.string().max(100, "Company name too long").optional(),
  address1: z.string().min(1, "Address line 1 is required").max(100, "Address too long"),
  address2: z.string().max(100, "Address too long").optional(),
  city: z.string().min(1, "City is required").max(50, "City name too long"),
  state: z.string().min(1, "State is required").max(50, "State name too long"),
  postalCode: z.string().min(1, "Postal code is required").max(20, "Postal code too long"),
  country: z.string().min(2, "Country is required").max(2, "Use 2-letter country code"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
    .optional(),
  isDefault: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// User Registration Schema
export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters"),
});

// User Login Schema
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

// Update User Profile Schema
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
    .optional(),
  newsletter: z.boolean().default(false),
  marketing: z.boolean().default(false),
});

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Create Address Schema
export const createAddressSchema = addressSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Update Address Schema
export const updateAddressSchema = createAddressSchema.partial();

// Type exports
export type User = z.infer<typeof userSchema>;
export type Address = z.infer<typeof addressSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type CreateAddress = z.infer<typeof createAddressSchema>;
export type UpdateAddress = z.infer<typeof updateAddressSchema>;
