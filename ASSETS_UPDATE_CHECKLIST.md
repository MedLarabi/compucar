# Assets Update Checklist for Luxana

## 🎨 Logo & Branding Assets

### Current Files to Replace

#### Primary Logo
- [ ] `/public/logo.png` - Main logo used in navigation and footer
  - Current: CompuCar automotive logo
  - Needed: Luxana luxury beauty logo
  - Recommended: Elegant, feminine design with rose gold/pink tones
  - Format: PNG with transparent background
  - Dimensions: Flexible (auto-scales), recommended minimum 200x80px

#### Favicon
- [ ] `/public/favicon.ico` - Browser tab icon
  - Current: CompuCar icon
  - Needed: Luxana "L" or compact logo
  - Format: ICO file, multiple sizes (16x16, 32x32, 48x48)

#### App Icons (PWA)
- [ ] `/public/icon-192.png` - Small app icon
  - Dimensions: 192x192px
  - Format: PNG
  - Purpose: Mobile app icon, PWA install
  
- [ ] `/public/icon-512.png` - Large app icon
  - Dimensions: 512x512px  
  - Format: PNG
  - Purpose: High-res app icon, splash screens

- [ ] `/public/apple-touch-icon.png` - Apple devices icon
  - Dimensions: 180x180px
  - Format: PNG
  - Purpose: iOS home screen icon

#### Social Media / SEO
- [ ] `/public/og-image.jpg` - Open Graph image
  - Current: Generic or CompuCar branded
  - Needed: Luxana branded image for social media sharing
  - Dimensions: 1200x630px (Facebook/LinkedIn), 1200x600px (Twitter)
  - Format: JPG or PNG
  - Content: Luxana logo + tagline + elegant beauty product imagery

---

## 📧 Contact Information Updates

### Footer Contact Details
**File**: `src/components/layout/footer.tsx` (lines 36-44)

Current:
```tsx
<Phone className="mr-2 h-4 w-4" />
<span>+213559231732</span>

<Mail className="mr-2 h-4 w-4" />
<span>support@compucar.pro</span>

<MapPin className="mr-2 h-4 w-4" />
<span>Bd de l'Université, Bab Ezzouar, Wilaya d'Alger, DZ</span>
```

Update needed:
- [ ] **Email**: Change `support@compucar.pro` → `support@luxana.com` (or your domain)
- [ ] **Phone**: Verify phone number is correct for Luxana
- [ ] **Address**: Verify address is correct for Luxana business location
- [ ] **Google Maps**: Update map embed URL if address changes

### Email Configuration
**File**: `.env` (create if doesn't exist)

```env
# Email settings
EMAIL_FROM=support@luxana.com
EMAIL_FROM_NAME=Luxana Beauty
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

Update:
- [ ] Email sender address
- [ ] Email sender name
- [ ] SMTP credentials if changed

---

## 🗄️ Database Content Updates

### Products Table
- [ ] **Review all product entries**:
  - Remove automotive products (brake pads, diagnostic tools, etc.)
  - Add beauty products (lipsticks, serums, fragrances, etc.)
  
- [ ] **Update product categories**:
  - OLD: Brake Parts, Engine Parts, Lighting, etc.
  - NEW: Makeup, Skincare, Fragrances, Hair Care, Wellness
  
- [ ] **Update product images**:
  - Replace automotive product images
  - Add beauty product imagery
  - Ensure high-quality, professional photos

### Categories Table
- [ ] Rename/replace all categories
- [ ] Update category descriptions
- [ ] Update category images/icons

### Blog Posts
- [ ] Review all blog articles
- [ ] Remove automotive content or update to beauty topics
- [ ] Examples:
  - OLD: "How to diagnose engine problems"
  - NEW: "How to choose the perfect foundation for your skin type"

### Sample Data / Seeding
- [ ] Update `prisma/seed.ts` or seeding scripts
- [ ] Remove automotive sample data
- [ ] Add beauty product samples

---

## 🎨 Design & Styling Updates

### Color Theme
**File**: `tailwind.config.js`

Current theme uses:
- Primary: Blue (#3B82F6)
- Suitable for tech/automotive

Consider updating to luxury beauty palette:
```javascript
// Suggested colors for Luxana
colors: {
  primary: {
    50: '#fdf4f5',
    100: '#fce7eb',
    200: '#f9d0d7',
    300: '#f5a9b8',
    400: '#ef7890',
    500: '#e4476f', // Main brand color (rose/pink)
    600: '#ce2c59',
    700: '#ae1e47',
    800: '#921c40',
    900: '#7d1a3b',
  },
  accent: {
    // Gold accent for luxury feel
    500: '#d4af37',
  }
}
```

Update:
- [ ] Review and update primary brand colors
- [ ] Add luxury accent colors (rose gold, soft pink, etc.)
- [ ] Update button styles
- [ ] Update link hover states

### Typography
**File**: `src/app/layout.tsx`

Current: Inter (neutral, professional)

Consider:
- [ ] Keep Inter for body text (good readability)
- [ ] Add elegant serif or script font for headers (optional)
- [ ] Examples: Playfair Display, Cormorant, Cinzel for luxury feel

### Component Styling
Files to review:
- [ ] `src/components/ui/button.tsx` - Button styles
- [ ] `src/components/ui/card.tsx` - Card borders and shadows
- [ ] Navigation bar styling
- [ ] Footer styling

---

## 🖼️ Image Assets by Section

### Homepage
- [ ] Hero section background image
  - Suggested: Elegant beauty products, luxury setting
  - Resolution: 1920x1080px minimum
  
- [ ] Featured products section images
  - High-quality product photography
  - Consistent styling and lighting

### Category Pages
- [ ] Category banner images for:
  - [ ] Makeup
  - [ ] Skincare
  - [ ] Fragrances
  - [ ] Hair Care
  - [ ] Wellness

### About/Contact Pages
- [ ] Store/office photos if applicable
- [ ] Team photos (optional)
- [ ] Brand story imagery

---

## 📱 Social Media Assets

### Profile Pictures
- [ ] Facebook profile picture (180x180px)
- [ ] Instagram profile picture (320x320px)
- [ ] Twitter profile picture (400x400px)
- [ ] LinkedIn profile picture (400x400px)

### Cover Photos
- [ ] Facebook cover (820x312px)
- [ ] Twitter header (1500x500px)
- [ ] LinkedIn banner (1584x396px)

### Content Template
- [ ] Instagram post template
- [ ] Instagram story template
- [ ] Product showcase template

---

## 🔍 SEO & Marketing Assets

### Meta Images
- [ ] Default OG image (1200x630px)
- [ ] Product template images
- [ ] Blog post featured images

### Email Marketing
- [ ] Email header template
- [ ] Email footer template
- [ ] Product showcase template for newsletters
- [ ] Logo for email signature

---

## ✅ Testing Checklist

After updating assets:

### Visual Testing
- [ ] Logo appears correctly on all pages
- [ ] Logo is visible in both light and dark modes
- [ ] Favicon shows in browser tabs
- [ ] Icons show on mobile devices when added to home screen
- [ ] OG image displays correctly when sharing links on social media

### Responsive Testing
- [ ] Logo scales properly on mobile devices
- [ ] Images load efficiently on slow connections
- [ ] Icons are crisp on high-DPI displays (Retina)

### Brand Consistency
- [ ] All assets use consistent color palette
- [ ] Typography is consistent across assets
- [ ] Brand voice is professional and luxurious
- [ ] No old CompuCar branding remains

---

## 📋 Quick Start: Minimum Required Updates

If you need to get started quickly, prioritize these:

1. **Logo** (`/public/logo.png`) - Most visible branding
2. **Favicon** (`/public/favicon.ico`) - Browser tab icon
3. **Contact Email** (footer.tsx) - Support email
4. **Primary Colors** (tailwind.config.js) - Brand colors
5. **OG Image** (`/public/og-image.jpg`) - Social sharing

These 5 changes will give you the most immediate visual impact.

---

## 🎨 Design Resources

### Free Stock Photos for Beauty
- Unsplash.com (search: "beauty products", "cosmetics", "skincare")
- Pexels.com (search: "makeup", "beauty", "luxury cosmetics")
- Pixabay.com (search: "beauty", "cosmetics")

### Logo Design
- Canva.com (Pro templates for beauty brands)
- Looka.com (AI logo generator)
- Fiverr.com (hire professional designer)

### Color Palette Inspiration
- Coolors.co (generate color schemes)
- Adobe Color (color wheel and harmony)
- Search "luxury beauty brand colors" for inspiration

### Icon Sets
- Lucide React (already installed) - elegant, minimal icons
- Heroicons (alternative icon set)
- Font Awesome (extensive icon library)

---

## 📞 Professional Help

Consider hiring professionals for:
- **Logo Designer**: For premium, unique logo ($50-500)
- **Brand Designer**: For complete brand identity ($500-2000)
- **Photographer**: For product photography (varies)
- **Copywriter**: For French/Arabic beauty-focused content ($0.05-0.30/word)

---

## ✨ Final Notes

**Remember**:
- All visual changes should reflect luxury, elegance, and femininity
- Maintain high quality - beauty brands require premium presentation
- Test on multiple devices and browsers
- Get feedback from target audience (women interested in beauty products)
- Consider A/B testing different color schemes or designs

**Timeline suggestion**:
- **Week 1**: Logo, favicon, primary colors, contact info
- **Week 2**: Database cleanup, product images, category updates
- **Week 3**: Polish UI, fine-tune colors, add marketing assets
- **Week 4**: Final testing, soft launch

Good luck with your Luxana transformation! 💄✨

