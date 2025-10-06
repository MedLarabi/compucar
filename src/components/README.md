# Components Directory Structure

This directory contains all reusable React components organized by feature and type.

## Directory Structure

```
components/
├── ui/                 # Base UI components (buttons, inputs, etc.)
├── layout/            # Layout components (header, footer, sidebar)
├── forms/             # Form components and form-related UI
├── product/           # Product-related components
├── cart/              # Shopping cart components
├── auth/              # Authentication components
└── admin/             # Admin dashboard components
```

## Component Guidelines

1. **UI Components**: Basic, reusable components with minimal business logic
2. **Feature Components**: Business logic components grouped by domain
3. **Layout Components**: Page structure and navigation components
4. **Form Components**: Form inputs, validation, and submission handling

## Naming Conventions

- Use PascalCase for component names
- Use kebab-case for file names when multiple words
- Include component type in name when helpful (e.g., `ProductCard`, `UserForm`)

