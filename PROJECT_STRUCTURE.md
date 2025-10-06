# CompuCar E-commerce Project Structure

This document outlines the complete folder structure and organization of the CompuCar e-commerce application.

## Directory Overview

```
compucar/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Authentication pages group
│   │   ├── (dashboard)/       # User dashboard pages group
│   │   ├── (shop)/           # Shopping pages group
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── products/     # Product CRUD endpoints
│   │   │   ├── orders/       # Order management endpoints
│   │   │   └── users/        # User management endpoints
│   │   ├── globals.css       # Global styles with Tailwind
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   │
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components (Shadcn/ui)
│   │   ├── layout/          # Layout components
│   │   ├── forms/           # Form components
│   │   ├── product/         # Product-related components
│   │   ├── cart/            # Shopping cart components
│   │   ├── auth/            # Authentication components
│   │   └── admin/           # Admin dashboard components
│   │
│   ├── hooks/               # Custom React hooks
│   │
│   ├── lib/                 # Utility libraries
│   │   ├── api/            # API client functions
│   │   ├── auth/           # Authentication utilities
│   │   ├── constants/      # Application constants
│   │   ├── database/       # Database utilities (Prisma)
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript type definitions
│   │   ├── validations/    # Schema re-exports
│   │   └── utils.ts        # General utilities
│   │
│   └── public/             # Static assets
│       ├── images/         # Product images, logos
│       └── icons/          # Icon assets
│
├── .cursorrules            # Development guidelines
├── .prettierrc            # Prettier configuration
├── .prettierignore        # Prettier ignore patterns
├── components.json        # Shadcn/ui configuration
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies and scripts
├── postcss.config.mjs     # PostCSS configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Architecture Patterns

### 1. **Feature-Based Organization**

Components are organized by feature (product, cart, auth) rather than type, promoting modularity and easier maintenance.

### 2. **Barrel Exports**

Each directory includes an `index.ts` file for clean imports:

```typescript
// Instead of
import { ProductCard } from "./components/product/product-card";
import { ProductList } from "./components/product/product-list";

// Use
import { ProductCard, ProductList } from "./components/product";
```

### 3. **Route Groups**

Next.js 15 route groups organize pages by purpose:

- `(auth)` - Login, register, forgot password
- `(dashboard)` - User profile, orders, settings
- `(shop)` - Product pages, cart, checkout

### 4. **Schema-First Development**

Zod schemas define data structure and validation, ensuring type safety across the application.

### 5. **State Management**

Zustand stores handle client-side state with persistence for cart data.

## Key Technologies

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **State Management**: Zustand
- **Validation**: Zod
- **Icons**: Lucide React
- **Code Quality**: ESLint + Prettier
- **Type Safety**: TypeScript

## Development Guidelines

1. **Component Creation**: Use PascalCase for components, place in appropriate feature directory
2. **Type Safety**: Always use TypeScript, leverage Zod schemas for validation
3. **State Management**: Use Zustand for global state, React hooks for local state
4. **Styling**: Use Tailwind classes, custom classes for complex components
5. **File Naming**: Use kebab-case for files, PascalCase for components

## Future Expansion

The structure is designed to scale with additional features:

- Database integration (Prisma + PostgreSQL)
- Authentication (NextAuth.js)
- Payment processing (Stripe)
- File uploads (UploadThing)
- Email services (Resend)
- Analytics (Recharts)

Each new feature will follow the established patterns and directory structure.

