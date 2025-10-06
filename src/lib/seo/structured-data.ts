import { Product, Category, BlogArticle, User } from '@prisma/client';

interface ProductWithCategory extends Product {
  category?: Category;
  reviews?: any[];
}

interface BlogArticleWithAuthor extends BlogArticle {
  author: User;
  category?: Category;
}

export const generateOrganizationStructuredData = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CompuCar",
    "description": "Premium automotive parts and accessories for car enthusiasts",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "image": `${baseUrl}/og-image.jpg`,
    "sameAs": [
      "https://facebook.com/compucar",
      "https://twitter.com/compucar",
      "https://instagram.com/compucar",
      "https://youtube.com/compucar"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-COMPUCAR",
      "contactType": "customer service",
      "areaServed": "US",
      "availableLanguage": ["English", "Spanish"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Auto Parts Blvd",
      "addressLocality": "Detroit",
      "addressRegion": "MI",
      "postalCode": "48201",
      "addressCountry": "US"
    },
    "priceRange": "$$",
    "foundingDate": "2020",
    "founders": [
      {
        "@type": "Person",
        "name": "CompuCar Team"
      }
    ]
  };
};

export const generateWebsiteStructuredData = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CompuCar",
    "description": "Premium automotive parts and accessories",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?query={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateProductStructuredData = (product: ProductWithCategory) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  
  const averageRating = product.reviews?.length 
    ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length 
    : 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images || `${baseUrl}/placeholder-product.jpg`,
    "sku": product.sku,
    "mpn": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "CompuCar"
    },
    "category": product.category?.name || "Automotive Parts",
    "url": `${baseUrl}/products/${product.slug}`,
    "offers": {
      "@type": "Offer",
      "price": product.price.toString(),
      "priceCurrency": "DZD",
      "availability": product.quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "condition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "CompuCar"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "DZD"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 7,
            "unitCode": "DAY"
          }
        }
      }
    },
    ...(product.reviews?.length && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": product.reviews.length,
        "bestRating": "5",
        "worstRating": "1"
      }
    }),
    "manufacturer": {
      "@type": "Organization",
      "name": product.brand || "CompuCar"
    }
  };
};

export const generateBreadcrumbStructuredData = (items: Array<{name: string, url: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};

export const generateBlogArticleStructuredData = (article: BlogArticleWithAuthor) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt || article.title,
    "image": article.featuredImage || `${baseUrl}/og-image.jpg`,
    "author": {
      "@type": "Person",
      "name": article.author.name || `${article.author.firstName} ${article.author.lastName}`,
      "image": article.author.image,
      "url": `${baseUrl}/author/${article.author.id}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "CompuCar",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "datePublished": article.publishedAt?.toISOString(),
    "dateModified": article.updatedAt.toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${article.slug}`
    },
    "url": `${baseUrl}/blog/${article.slug}`,
    "wordCount": article.content.split(' ').length,
    "timeRequired": `PT${article.readTime || 5}M`,
    "articleSection": article.category?.name || "Automotive",
    "keywords": article.tags?.map((tag: any) => tag.name).join(', ') || "automotive, cars, parts"
  };
};

export const generateLocalBusinessStructuredData = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CompuCar",
    "description": "Premium automotive parts and accessories store",
    "image": `${baseUrl}/storefront.jpg`,
    "url": baseUrl,
    "telephone": "+1-555-COMPUCAR",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Auto Parts Blvd",
      "addressLocality": "Detroit",
      "addressRegion": "MI",
      "postalCode": "48201",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "42.3314",
      "longitude": "-83.0458"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "17:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "11:00",
        "closes": "16:00"
      }
    ],
    "priceRange": "$$",
    "paymentAccepted": ["Credit Card", "PayPal", "Cash"],
    "currenciesAccepted": "DZD"
  };
};

export const generateFAQStructuredData = (faqs: Array<{question: string, answer: string}>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};
