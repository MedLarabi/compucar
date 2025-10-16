"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/constants/languages';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [hasMounted, setHasMounted] = useState(false);

  const fetchTranslations = async (lang: Language, isLanguageChange = false) => {
    try {
      // Only set loading to true on initial load or if no translations exist
      if (Object.keys(translations).length === 0) {
        setIsLoading(true);
      } else if (isLanguageChange) {
        setIsChangingLanguage(true);
      }
      
      const response = await fetch(`/api/locales/${lang}/common.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
        console.log(`✅ Loaded translations for ${lang}:`, data);
      } else {
        console.warn(`⚠️ Failed to load translations for ${lang}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error loading translations for ${lang}:`, error);
    } finally {
      // Add a small delay to prevent flickering on fast connections
      setTimeout(() => {
        setIsLoading(false);
        setIsChangingLanguage(false);
      }, 100);
    }
  };

  // Function to detect user's preferred language
  const detectUserLanguage = (): Language => {
    if (typeof window === 'undefined') {
      return 'ar'; // Default to Arabic on server
    }

    // Check if there's a saved language preference
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['en', 'fr', 'ar'].includes(savedLanguage)) {
      console.log(`🔍 Found saved language: ${savedLanguage}`);
      return savedLanguage;
    }

    // Detect browser language
    const browserLanguage = navigator.language || navigator.languages?.[0] || '';
    console.log(`🌐 Browser language detected: ${browserLanguage}`);
    
    // Map browser language codes to our supported languages
    if (browserLanguage.startsWith('ar')) {
      console.log('✅ Arabic language detected from browser');
      return 'ar';
    } else if (browserLanguage.startsWith('fr')) {
      console.log('✅ French language detected from browser');
      return 'fr';
    } else if (browserLanguage.startsWith('en')) {
      console.log('✅ English language detected from browser');
      return 'en';
    }

    // Check secondary languages from navigator.languages
    if (navigator.languages) {
      for (const lang of navigator.languages) {
        if (lang.startsWith('ar')) {
          console.log('✅ Arabic found in secondary languages');
          return 'ar';
        } else if (lang.startsWith('fr')) {
          console.log('✅ French found in secondary languages');
          return 'fr';
        } else if (lang.startsWith('en')) {
          console.log('✅ English found in secondary languages');
          return 'en';
        }
      }
    }

    // Default to Arabic if no supported language is detected
    console.log('🔄 No supported language detected, defaulting to Arabic');
    return 'ar';
  };

  useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== 'undefined') {
      const detectedLanguage = detectUserLanguage();
      console.log(`🎯 Setting initial language to: ${detectedLanguage}`);
      setLanguage(detectedLanguage);
      fetchTranslations(detectedLanguage);
    } else {
      // On server, default to Arabic
      console.log('🖥️ Server-side: defaulting to Arabic');
      setLanguage('ar');
      fetchTranslations('ar');
    }
  }, []);

  // Fetch translations when language changes
  useEffect(() => {
    if (language) {
      const isLanguageChange = hasMounted && Object.keys(translations).length > 0;
      fetchTranslations(language, isLanguageChange);
    }
  }, [language]);

  useEffect(() => {
    // Only save to localStorage after component has mounted
    if (hasMounted && typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language, hasMounted]);

  // Multi-language fallback translations
  const getFallbackTranslation = (key: string): string => {
    const translations: Record<Language, Record<string, string>> = {
      en: {
        'navigation.categories': 'Categories',
        'checkout.cod.title': 'Cash on Delivery Checkout',
        'cart.title': 'Shopping Cart',
        'cart.empty': 'Cart is Empty',
        'cart.addProductsToStart': 'Add products to start shopping',
        'cart.continue': 'Continue Shopping',
        'search.placeholder': 'Search products...',
        'filters.sortBy': 'Sort by',
        'filters.newest': 'Newest',
        'filters.oldest': 'Oldest',
        'filters.priceLowHigh': 'Price: Low to High',
        'filters.priceHighLow': 'Price: High to Low',
        'filters.nameAZ': 'Name: A-Z',
        'filters.nameZA': 'Name: Z-A',
        'filters.highestRated': 'Highest Rated',
        'filters.priceRange': 'Price Range',
        'filters.apply': 'Apply',
        'categories.title': 'Product Categories',
        'categories.description': 'Browse our products by category',
        'categories.searchPlaceholder': 'Search categories...',
        'categories.viewProducts': 'View Products',
        'categories.subcategories': 'Subcategories',
        'categories.more': 'more',
        'categories.cantFind': "Can't find what you're looking for?",
        'categories.browseAllDescription': 'Browse all our products or use advanced search to find exactly what you need.',
        'categories.browseAllProducts': 'Browse All Products',
        'categories.advancedSearch': 'Advanced Search',
        'categories.failedToLoad': 'Failed to load categories',
        'categories.errorLoading': 'Error Loading Categories',
        'categories.noCategoriesFound': 'No Categories Found',
        'categories.organizingCategories': 'We are currently organizing our product categories.',
        'messages.premiumAutoParts': 'Premium automotive parts and accessories',
        'messages.discoverWideRange': 'Discover our wide range of automotive parts and accessories',
        'hero.title': 'Premium Auto Parts',
        'common.menu': 'Menu',
        'common.product': 'product',
        'common.products': 'products',
        'common.tryAgain': 'Try Again',
        'navigation.login': 'Login',
        'navigation.register': 'Register',
        'courses.loading': 'Loading courses...',
        'courses.loadingVideo': 'Loading video...',
        'courses.selectVideoToPlay': 'Select a video to play',
        'courses.videoFormatNotSupported': 'Video format not supported',
        'courses.videoRequiresEnrollment': 'This video requires enrollment',
        'courses.courseNotFound': 'Course not found',
        'courses.backToCourses': 'Back to Courses',
        'courses.previousVideo': 'Previous Video',
        'courses.nextVideo': 'Next Video',
        'courses.courseContent': 'Course Content',
        'courses.freeCourse': 'FREE COURSE',
        'courses.hasFreePreviews': 'HAS FREE PREVIEWS',
        'courses.freeModule': 'Free Preview Module',
        'courses.min': 'min',
        'courses.hours': 'hours',
        'courses.students': 'students',
        'courses.moduleCount': '{count} modules',
        'courses.videoCount': '{count} videos',
        'courses.enrollmentCount': '{count} students',
        'courses.videoOf': '{current} of {total}',
        'product.clearSelection': 'Clear Selection',
        'product.currentSelection': 'Current selection',
        'product.combinationNotAvailable': 'This combination is not available as a complete product',
        'product.tryDifferentOptions': 'Try selecting different options to find available combinations',
        'product.selectAllOptions': 'Please select all options to see the final price and availability.'
      },
      fr: {
        'navigation.categories': 'Catégories',
        'checkout.cod.title': 'Commande contre remboursement',
        'cart.title': 'Panier',
        'cart.empty': 'Panier vide',
        'cart.addProductsToStart': 'Ajoutez des produits pour commencer vos achats',
        'cart.continue': 'Continuer les achats',
        'search.placeholder': 'Rechercher des produits...',
        'filters.sortBy': 'Trier par',
        'filters.newest': 'Plus récent',
        'filters.oldest': 'Plus ancien',
        'filters.priceLowHigh': 'Prix: Croissant',
        'filters.priceHighLow': 'Prix: Décroissant',
        'filters.nameAZ': 'Nom: A-Z',
        'filters.nameZA': 'Nom: Z-A',
        'filters.highestRated': 'Mieux noté',
        'filters.priceRange': 'Gamme de prix',
        'filters.apply': 'Appliquer',
        'categories.title': 'Catégories de produits',
        'categories.description': 'Parcourez nos produits par catégorie',
        'categories.searchPlaceholder': 'Rechercher des catégories...',
        'categories.viewProducts': 'Voir les produits',
        'categories.subcategories': 'Sous-catégories',
        'categories.more': 'plus',
        'categories.cantFind': "Vous ne trouvez pas ce que vous cherchez?",
        'categories.browseAllDescription': 'Parcourez tous nos produits ou utilisez la recherche avancée pour trouver exactement ce dont vous avez besoin.',
        'categories.browseAllProducts': 'Parcourir tous les produits',
        'categories.advancedSearch': 'Recherche avancée',
        'categories.failedToLoad': 'Échec du chargement des catégories',
        'categories.errorLoading': 'Erreur de chargement des catégories',
        'categories.noCategoriesFound': 'Aucune catégorie trouvée',
        'categories.organizingCategories': 'Nous organisons actuellement nos catégories de produits.',
        'messages.premiumAutoParts': 'Pièces et accessoires automobiles de qualité',
        'messages.discoverWideRange': 'Découvrez notre large gamme de pièces et accessoires automobiles',
        'hero.title': 'Pièces automobiles de qualité',
        'common.menu': 'Menu',
        'common.product': 'produit',
        'common.products': 'produits',
        'common.tryAgain': 'Réessayer',
        'navigation.login': 'Connexion',
        'navigation.register': "S'inscrire",
        'courses.loading': 'Chargement des cours...',
        'courses.loadingVideo': 'Chargement de la vidéo...',
        'courses.selectVideoToPlay': 'Sélectionnez une vidéo à lire',
        'courses.videoFormatNotSupported': 'Format vidéo non pris en charge',
        'courses.videoRequiresEnrollment': 'Cette vidéo nécessite une inscription',
        'courses.courseNotFound': 'Cours non trouvé',
        'courses.backToCourses': 'Retour aux Cours',
        'courses.previousVideo': 'Vidéo Précédente',
        'courses.nextVideo': 'Vidéo Suivante',
        'courses.courseContent': 'Contenu du Cours',
        'courses.freeCourse': 'COURS GRATUIT',
        'courses.hasFreePreviews': 'A DES APERÇUS GRATUITS',
        'courses.freeModule': 'Module d\'Aperçu Gratuit',
        'courses.min': 'min',
        'courses.hours': 'heures',
        'courses.students': 'étudiants',
        'courses.moduleCount': '{count} modules',
        'courses.videoCount': '{count} vidéos',
        'courses.enrollmentCount': '{count} étudiants',
        'courses.videoOf': '{current} sur {total}',
        'product.clearSelection': 'Effacer la sélection',
        'product.currentSelection': 'Sélection actuelle',
        'product.combinationNotAvailable': 'Cette combinaison n\'est pas disponible en tant que produit complet',
        'product.tryDifferentOptions': 'Essayez de sélectionner différentes options pour trouver des combinaisons disponibles',
        'product.selectAllOptions': 'Veuillez sélectionner toutes les options pour voir le prix final et la disponibilité.'
      },
      ar: {
        'navigation.categories': 'الفئات',
        'checkout.cod.title': 'الدفع عند الاستلام',
        'cart.title': 'سلة التسوق',
        'cart.empty': 'السلة فارغة',
        'cart.addProductsToStart': 'أضف منتجات لبدء التسوق',
        'cart.continue': 'متابعة التسوق',
        'search.placeholder': 'البحث عن المنتجات...',
        'filters.sortBy': 'ترتيب حسب',
        'filters.newest': 'الأحدث',
        'filters.oldest': 'الأقدم',
        'filters.priceLowHigh': 'السعر: من الأقل إلى الأعلى',
        'filters.priceHighLow': 'السعر: من الأعلى إلى الأقل',
        'filters.nameAZ': 'الاسم: أ-ي',
        'filters.nameZA': 'الاسم: ي-أ',
        'filters.highestRated': 'الأعلى تقييماً',
        'filters.priceRange': 'نطاق السعر',
        'filters.apply': 'تطبيق',
        'categories.title': 'فئات المنتجات',
        'categories.description': 'تصفح منتجاتنا حسب الفئة',
        'categories.searchPlaceholder': 'البحث في الفئات...',
        'categories.viewProducts': 'عرض المنتجات',
        'categories.subcategories': 'الفئات الفرعية',
        'categories.more': 'المزيد',
        'categories.cantFind': "لا تجد ما تبحث عنه؟",
        'categories.browseAllDescription': 'تصفح جميع منتجاتنا أو استخدم البحث المتقدم للعثور على ما تحتاجه بالضبط.',
        'categories.browseAllProducts': 'تصفح جميع المنتجات',
        'categories.advancedSearch': 'البحث المتقدم',
        'categories.failedToLoad': 'فشل في تحميل الفئات',
        'categories.errorLoading': 'خطأ في تحميل الفئات',
        'categories.noCategoriesFound': 'لم يتم العثور على فئات',
        'categories.organizingCategories': 'نحن نقوم حالياً بتنظيم فئات منتجاتنا.',
        'messages.premiumAutoParts': 'قطع غيار وإكسسوارات سيارات عالية الجودة',
        'messages.discoverWideRange': 'اكتشف مجموعتنا الواسعة من قطع غيار وإكسسوارات السيارات',
        'hero.title': 'قطع غيار سيارات عالية الجودة',
        'common.menu': 'القائمة',
        'common.product': 'منتج',
        'common.products': 'منتجات',
        'common.tryAgain': 'حاول مرة أخرى',
        'navigation.login': 'تسجيل الدخول',
        'navigation.register': 'إنشاء حساب',
        'courses.loading': 'تحميل الدورات...',
        'courses.loadingVideo': 'تحميل الفيديو...',
        'courses.selectVideoToPlay': 'اختر فيديو للتشغيل',
        'courses.videoFormatNotSupported': 'تنسيق الفيديو غير مدعوم',
        'courses.videoRequiresEnrollment': 'هذا الفيديو يتطلب التسجيل',
        'courses.courseNotFound': 'الدورة غير موجودة',
        'courses.backToCourses': 'العودة إلى الدورات',
        'courses.previousVideo': 'الفيديو السابق',
        'courses.nextVideo': 'الفيديو التالي',
        'courses.courseContent': 'محتوى الدورة',
        'courses.freeCourse': 'دورة مجانية',
        'courses.hasFreePreviews': 'لديها معاينات مجانية',
        'courses.freeModule': 'وحدة معاينة مجانية',
        'courses.min': 'دقيقة',
        'courses.hours': 'ساعات',
        'courses.students': 'طلاب',
        'courses.moduleCount': '{count} وحدات',
        'courses.videoCount': '{count} فيديوهات',
        'courses.enrollmentCount': '{count} طلاب',
        'courses.videoOf': '{current} من {total}',
        'product.clearSelection': 'مسح التحديد',
        'product.currentSelection': 'التحديد الحالي',
        'product.combinationNotAvailable': 'هذه التركيبة غير متوفرة كمنتج كامل',
        'product.tryDifferentOptions': 'جرب اختيار خيارات مختلفة للعثور على تركيبات متاحة',
        'product.selectAllOptions': 'يرجى تحديد جميع الخيارات لرؤية السعر النهائي والتوفر.'
      }
    };

    const languageTranslations = translations[language] || translations.en;
    return languageTranslations[key] || key;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Try to get from loaded translations first
    if (translations && Object.keys(translations).length > 0) {
      const translation = getNestedTranslation(translations, key);
      if (translation && translation !== key) {
        let result = translation;
        if (params) {
          Object.entries(params).forEach(([param, value]) => {
            result = result.replace(`{${param}}`, String(value));
          });
        }
        return result;
      } else {
        console.warn(`🔍 Translation missing for key "${key}" in language "${language}"`);
      }
    } else {
      // If translations are still loading, return empty string to prevent flash
      if (isLoading) {
        return '';
      }
      console.warn(`⚠️ No translations loaded yet for language "${language}"`);
    }

    // Use fallback if no translations loaded or translation missing
    return getFallbackTranslation(key);
  };

  // Helper function to get nested translations (e.g., "navigation.categories")
  const getNestedTranslation = (obj: any, path: string): string | null => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
    isChangingLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string) => key,
      isLoading: false,
      isChangingLanguage: false,
    };
  }
  return context;
}
