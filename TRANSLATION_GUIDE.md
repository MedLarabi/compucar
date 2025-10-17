# Translation Guide for Luxana Rebranding

## Quick Reference: Key Terms to Update

This guide helps update French and Arabic translations from CompuCar (automotive) to Luxana (beauty).

---

## 🔄 Key Term Translations

### Core Business Terms

| English | French | Arabic | Context |
|---------|--------|--------|---------|
| Auto diagnostic tools | Produits de beauté de luxe | منتجات التجميل الفاخرة | Main category |
| Premium automotive parts | Produits cosmétiques premium | مستحضرات تجميل فاخرة | Description |
| Diagnostic equipment | Équipement de beauté | معدات التجميل | Equipment |
| Vehicle analysis | Analyse beauté | تحليل الجمال | Service type |

### Product Categories

| English | French | Arabic | Old Term |
|---------|--------|--------|----------|
| Makeup | Maquillage | مكياج | Brake Parts |
| Skincare | Soins de la peau | العناية بالبشرة | Engine Parts |
| Fragrances | Parfums | العطور | Lighting |
| Hair Care | Soins capillaires | العناية بالشعر | Filters |
| Wellness | Bien-être | العافية | Performance |

### Services

| English | French | Arabic | Old Term |
|---------|--------|--------|----------|
| Consultations | Consultations | استشارات | Tuning |
| Beauty consultation | Consultation beauté | استشارة تجميل | ECU tuning |
| Skin analysis | Analyse de peau | تحليل البشرة | Diagnostic scan |
| Requirements | Exigences | المتطلبات | Error codes |

---

## 📝 Sections to Update in Translation Files

### 1. Hero Section
**Location**: `hero` object

```json
"hero": {
  "title": "UPDATE: Premium Luxury Beauty",
  "subtitle": "UPDATE: Elegance You Can Trust", 
  "description": "UPDATE: Discover the finest collection of luxury beauty products..."
}
```

**French suggestions**:
- title: "Beauté de Luxe Premium"
- subtitle: "Élégance en Laquelle Vous Pouvez Avoir Confiance"
- description: "Découvrez la plus belle collection de produits de beauté de luxe..."

**Arabic suggestions**:
- title: "جمال فاخر متميز"
- subtitle: "أناقة يمكنك الثقة بها"
- description: "اكتشف أفضل مجموعة من منتجات التجميل الفاخرة..."

### 2. Categories
**Location**: `categories` object

```json
"categories": {
  "brakeParts": "UPDATE: Makeup / Maquillage / مكياج",
  "engineParts": "UPDATE: Skincare / Soins de la peau / العناية بالبشرة",
  "lighting": "UPDATE: Fragrances / Parfums / العطور",
  "filters": "UPDATE: Hair Care / Soins capillaires / العناية بالشعر",
  "performance": "UPDATE: Wellness / Bien-être / العافية"
}
```

### 3. Messages
**Location**: `messages` object

```json
"messages": {
  "premiumAutoParts": "UPDATE: Premium luxury beauty products...",
  "discoverWideRange": "UPDATE: Discover our wide range of luxury beauty products...",
  "discoverQualityParts": "UPDATE: Discover luxury beauty products..."
}
```

**French**:
- premiumAutoParts: "Produits de beauté de luxe premium"
- discoverWideRange: "Découvrez notre large gamme de produits de beauté de luxe"

**Arabic**:
- premiumAutoParts: "منتجات التجميل الفاخرة المتميزة"
- discoverWideRange: "اكتشف مجموعتنا الواسعة من منتجات التجميل الفاخرة"

### 4. Upload/Consultation Section
**Location**: `upload` object

Key changes:
- "tuning" → "consultation"
- "ECU file" → "consultation file"
- "modifications" → "services"
- "DTC error codes" → "specific requirements"

**French**:
- title: "Télécharger un Fichier pour Consultation"
- description: "Téléchargez votre demande de consultation..."
- modifications.title: "Sélectionner les Services"

**Arabic**:
- title: "رفع ملف للاستشارة"
- description: "ارفع طلب استشارتك..."
- modifications.title: "اختيار الخدمات"

### 5. Footer
**Location**: `footer` object

```json
"footer": {
  "companyDescription": "UPDATE: Your trusted partner for premium luxury beauty products..."
}
```

**French**:
"Votre partenaire de confiance pour les produits de beauté de luxe premium. Nous fournissons des essentiels de beauté authentiques et de haute qualité pour vous aider à paraître et à vous sentir au mieux chaque jour."

**Arabic**:
"شريكك الموثوق لمنتجات التجميل الفاخرة المتميزة. نحن نقدم مستلزمات تجميل أصلية وعالية الجودة لمساعدتك على أن تبدو وتشعر بأفضل ما لديك كل يوم."

### 6. Welcome Message
**Location**: `welcome` key

```json
"welcome": "UPDATE: Welcome to our premium luxury beauty store"
```

**French**: "Bienvenue dans notre magasin de beauté de luxe premium"
**Arabic**: "مرحباً بك في متجر التجميل الفاخر المتميز"

### 7. Order Success
**Location**: `orderSuccess.welcome`

```json
"orderSuccess": {
  "welcome": "UPDATE: Welcome to Luxana! 🎉"
}
```

**French**: "Bienvenue chez Luxana ! 🎉"
**Arabic**: "مرحباً بك في لوكسانا! 🎉"

---

## 🎯 Priority Updates by Section

### HIGH PRIORITY (User-facing)
1. ✅ `hero` - Homepage hero section
2. ✅ `categories` - Product categories
3. ✅ `footer.companyDescription` - Company description
4. ✅ `welcome` - Welcome message
5. ✅ `messages.premiumAutoParts` - Main tagline
6. ✅ `messages.discoverWideRange` - Discovery message

### MEDIUM PRIORITY (Common features)
7. ✅ `navigation.tuning` → "consultations"
8. ✅ `product` section - Product descriptions
9. ✅ `upload` section - Consultation upload
10. ✅ `files` section - File management

### LOW PRIORITY (Admin/technical)
11. `admin` section - Admin panel (mostly technical terms)
12. `dashboard` section - User dashboard
13. Technical error messages

---

## 📖 Example: Full Section Update

### Before (CompuCar - French):
```json
"hero": {
  "title": "Outils de Diagnostic Auto Premium",
  "subtitle": "Qualité de Confiance",
  "description": "Trouvez les meilleurs outils de diagnostic et équipements pour l'analyse professionnelle des véhicules"
}
```

### After (Luxana - French):
```json
"hero": {
  "title": "Beauté de Luxe Premium",
  "subtitle": "Élégance en Laquelle Vous Pouvez Avoir Confiance",
  "description": "Découvrez la plus belle collection de produits de beauté de luxe et de cosmétiques pour la femme moderne"
}
```

### Before (CompuCar - Arabic):
```json
"hero": {
  "title": "أدوات تشخيص السيارات المتميزة",
  "subtitle": "جودة يمكنك الوثوق بها",
  "description": "اعثر على أفضل أدوات التشخيص والمعدات للتحليل المهني للمركبات"
}
```

### After (Luxana - Arabic):
```json
"hero": {
  "title": "جمال فاخر متميز",
  "subtitle": "أناقة يمكنك الثقة بها",
  "description": "اكتشف أفضل مجموعة من منتجات التجميل الفاخرة ومستحضرات التجميل للمرأة العصرية"
}
```

---

## 🔍 Search & Replace Patterns

### For French Translation File

| Find | Replace |
|------|---------|
| outils de diagnostic | produits de beauté |
| automobile | beauté |
| diagnostic | consultation beauté |
| véhicule | client |
| pièces auto | cosmétiques |
| CompuCar | Luxana |

### For Arabic Translation File

| Find | Replace |
|------|---------|
| أدوات تشخيص | منتجات تجميل |
| السيارات | التجميل |
| تشخيص | استشارة تجميل |
| المركبات | العميل |
| قطع غيار | مستحضرات تجميل |
| كومبيوكار | لوكسانا |

---

## ⚠️ Important Notes

### For French Translation:
1. Beauty products are **masculine** in French: "le produit de beauté"
2. Cosmetics is **feminine**: "la cosmétique"
3. Makeup is **masculine**: "le maquillage"
4. Skincare uses "soins" (care): "les soins de la peau"

### For Arabic Translation:
1. Beauty (جمال) is masculine
2. Cosmetics (مستحضرات التجميل) is feminine plural
3. Makeup (مكياج) is masculine
4. Keep text direction LTR as configured (not RTL) per your app settings

### General Tips:
- Maintain formal/professional tone in all languages
- Use feminine forms when addressing women customers
- Keep luxury/premium connotation in translations
- Test all translations in the actual UI for length/layout

---

## 🛠️ Quick Update Process

1. **Open** `locales/fr/common.json` or `locales/ar/common.json`
2. **Search** for automotive terms using the Find patterns above
3. **Replace** with beauty equivalents
4. **Review** key user-facing sections (hero, categories, footer)
5. **Test** in the application to verify:
   - Text fits in UI components
   - Maintains professional tone
   - Translations are contextually appropriate

---

## ✅ Validation Checklist

After updating translations:

- [ ] Hero section displays correctly
- [ ] Category names are appropriate for beauty products  
- [ ] Footer description matches Luxana branding
- [ ] Navigation items make sense (Consultations instead of Tuning)
- [ ] Product-related text uses beauty terminology
- [ ] Welcome messages mention Luxana
- [ ] Contact information is appropriate
- [ ] No remaining automotive references
- [ ] Text length works in UI (no overflow issues)
- [ ] Professional/elegant tone maintained

---

## 📞 Need Help?

If unsure about a translation:
1. Refer to English translation in `locales/en/common.json`
2. Check context of where it's used in the UI
3. Use professional beauty industry terminology
4. Maintain luxury/premium brand voice
5. Consider hiring professional translator for marketing-critical sections

Good luck with the translation updates! 🎨✨

