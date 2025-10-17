This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

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
