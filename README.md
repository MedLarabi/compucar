# Luxana - Premium Luxury Beauty & Cosmetics E-Commerce

A modern, full-featured e-commerce platform built with Next.js 15, designed for luxury beauty products and cosmetics.

## About Luxana

Luxana is a premium e-commerce platform offering luxury beauty products, cosmetics, skincare, and makeup for women. The platform provides a sophisticated shopping experience with features like:

- 🛍️ Full-featured shopping cart and checkout
- 💄 Product catalog with categories (makeup, skincare, fragrances, etc.)
- 🎓 Beauty tutorial courses and video content
- 📦 Order management and tracking
- 💳 Multiple payment options (Cash on Delivery, Stripe)
- 🌍 Multi-language support (English, French, Arabic)
- 🎨 Beautiful, responsive UI with dark mode support
- 👤 User accounts and wishlists
- 📊 Admin dashboard for store management

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **UI Components:** Shadcn/ui + Tailwind CSS
- **State Management:** Zustand
- **Form Validation:** Zod + React Hook Form
- **File Uploads:** UploadThing
- **Payments:** Stripe
- **Email:** Nodemailer
- **Analytics:** Vercel Analytics

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🌍 **Internationalization (i18n)**

The website supports multiple languages with a focus on maintaining consistent layout across all languages.

### **Supported Languages:**
- 🇺🇸 **English** (default)
- 🇫🇷 **Français** 
- 🇩🇿 **العربية** (Arabic)

### **Language Behavior:**
- **Text Translation**: All text content is translated to the selected language
- **Layout Consistency**: Layout remains left-to-right (LTR) for all languages
- **Font Support**: Arabic text uses Noto Sans Arabic font for proper rendering
- **No RTL Layout**: Arabic content flows left-to-right like English and French

### **Usage:**
- Click the globe icon (🌍) in the navigation to switch languages
- Language preference is saved in localStorage
- All pages and components support language switching
- Forms, buttons, and layout structure remain in the same position

### **Adding New Languages:**
1. Add language code to `LANGUAGES` object in `LanguageContext.tsx`
2. Create translation file in `locales/[lang]/common.json`
3. Update API route in `src/app/api/locales/[lang]/[file]/route.ts`
