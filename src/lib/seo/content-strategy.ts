/**
 * SEO Content Strategy for CompuCar E-commerce
 * 
 * This file contains utilities and guidelines for implementing
 * effective SEO content strategies across the platform.
 */

// Automotive-specific keywords and categories
export const AUTOMOTIVE_KEYWORDS = {
  // Primary categories
  PRIMARY: [
    'car accessories',
    'auto diagnostic tools',
    'car diagnostic equipment',
    'OBD scanner',
    'automotive diagnostics',
    'vehicle diagnostic tools',
    'car tuning',
    'performance parts',
    'car modifications',
    'vehicle upgrades'
  ],
  
  // Product-specific keywords
  PRODUCTS: [
    'car headlights',
    'LED headlights',
    'car spoilers',
    'performance exhaust',
    'car mirrors',
    'racing seats',
    'car wheels',
    'brake pads',
    'air filters',
    'car electronics'
  ],
  
  // Long-tail keywords
  LONG_TAIL: [
    'best car accessories for',
    'how to install car',
    'car tuning parts for',
    'performance upgrades for',
    'car modification guide',
    'diagnostic tools review'
  ],
  
  // Local/Regional keywords
  LOCAL: [
    'car parts shop',
    'automotive store',
    'car tuning shop',
    'car accessories store',
    'performance parts dealer'
  ]
};

// Content templates for different page types
export const SEO_CONTENT_TEMPLATES = {
  // Product page SEO content
  PRODUCT: {
    titleTemplate: '{productName} - {category} | CompuCar',
    descriptionTemplate: 'Shop {productName} at CompuCar. High-quality {category} with fast shipping. {benefits}. Order now!',
    keywordDensity: 2.5, // Target 2-3% keyword density
    minContentLength: 300, // Minimum content length for SEO
    
    // Content sections to include
    requiredSections: [
      'product-description',
      'specifications',
      'installation-guide',
      'compatibility',
      'reviews',
      'related-products'
    ]
  },
  
  // Category page SEO content
  CATEGORY: {
    titleTemplate: '{categoryName} - Premium Diagnostic Tools | CompuCar',
    descriptionTemplate: 'Discover our {categoryName} collection. Premium quality diagnostic tools and equipment. Free shipping on orders over 50 DA.',
    keywordDensity: 3.0,
    minContentLength: 500,
    
    requiredSections: [
      'category-overview',
      'featured-products',
      'buying-guide',
      'brands',
      'filters',
      'faq'
    ]
  },
  
  // Blog post SEO content
  BLOG: {
    titleTemplate: '{title} - Car Tips & Guides | CompuCar Blog',
    descriptionTemplate: '{excerpt} Expert automotive advice from CompuCar professionals.',
    keywordDensity: 1.5,
    minContentLength: 800,
    
    requiredSections: [
      'introduction',
      'main-content',
      'step-by-step-guide',
      'tips-and-warnings',
      'conclusion',
      'related-articles'
    ]
  }
};

// Blog content strategy
export const BLOG_CONTENT_STRATEGY = {
  // Content pillars
  PILLARS: [
    {
      name: 'How-To Guides',
      keywords: ['how to install', 'installation guide', 'DIY car'],
      contentTypes: ['step-by-step tutorials', 'video guides', 'infographics'],
      frequency: 'Weekly',
      seoValue: 'High'
    },
    {
      name: 'Product Reviews',
      keywords: ['car parts review', 'best car accessories', 'product comparison'],
      contentTypes: ['in-depth reviews', 'comparison articles', 'buyer guides'],
      frequency: 'Bi-weekly',
      seoValue: 'Very High'
    },
    {
      name: 'Maintenance Tips',
      keywords: ['car maintenance', 'automotive care', 'car care tips'],
      contentTypes: ['maintenance schedules', 'seasonal guides', 'troubleshooting'],
      frequency: 'Weekly',
      seoValue: 'High'
    },
    {
      name: 'Industry News',
      keywords: ['automotive news', 'car industry trends', 'new car technology'],
      contentTypes: ['news articles', 'trend analysis', 'technology updates'],
      frequency: 'Bi-weekly',
      seoValue: 'Medium'
    }
  ],
  
  // Content calendar suggestions
  CALENDAR: {
    MONTHLY_THEMES: {
      January: 'Winter Car Care',
      February: 'Interior Upgrades',
      March: 'Spring Maintenance',
      April: 'Performance Upgrades',
      May: 'Summer Preparation',
      June: 'Exterior Modifications',
      July: 'Road Trip Essentials',
      August: 'Cooling System Care',
      September: 'Back to School Car Safety',
      October: 'Fall Maintenance',
      November: 'Winter Preparation',
      December: 'Holiday Gift Guides'
    }
  }
};

// SEO optimization functions
export function generateProductSEOData(product: any) {
  const { name, category, description, brand, price } = product;
  
  return {
    title: `${name} - ${category.name} | CompuCar`,
    description: `Shop ${name} by ${brand}. Premium ${category.name} starting at $${price}. Fast shipping & expert support. Order now!`,
    keywords: [
      name.toLowerCase(),
      category.name.toLowerCase(),
      brand.toLowerCase(),
      `${category.name.toLowerCase()} for sale`,
      `buy ${name.toLowerCase()}`,
      `${brand.toLowerCase()} ${category.name.toLowerCase()}`
    ],
    structuredData: {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": name,
      "brand": {
        "@type": "Brand",
        "name": brand
      },
      "category": category.name,
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "DZD",
        "availability": "https://schema.org/InStock"
      }
    }
  };
}

export function generateCategorySEOData(category: any, productCount: number) {
  return {
    title: `${category.name} - Premium Diagnostic Tools | CompuCar`,
    description: `Discover ${productCount}+ premium ${category.name.toLowerCase()} at CompuCar. Top brands, competitive prices, fast shipping. Shop now!`,
    keywords: [
      category.name.toLowerCase(),
      `${category.name.toLowerCase()} for sale`,
      `buy ${category.name.toLowerCase()}`,
      `car ${category.name.toLowerCase()}`,
      `automotive ${category.name.toLowerCase()}`
    ]
  };
}

export function generateBlogSEOData(article: any) {
  return {
    title: `${article.title} - Car Tips & Guides | CompuCar Blog`,
    description: article.excerpt || `${article.title}. Expert automotive advice and guides from CompuCar professionals.`,
    keywords: [
      ...article.tags?.map((tag: any) => tag.name.toLowerCase()) || [],
      'car tips',
      'automotive guide',
      'car maintenance',
      'auto advice'
    ],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "author": {
        "@type": "Person",
        "name": article.author.name
      },
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt,
      "publisher": {
        "@type": "Organization",
        "name": "CompuCar"
      }
    }
  };
}

// Content optimization utilities
export function calculateKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => 
    keywordWords.some(kw => word.includes(kw))
  ).length;
  
  return (keywordCount / words.length) * 100;
}

export function suggestContentImprovements(content: string, targetKeyword: string) {
  const wordCount = content.split(/\s+/).length;
  const keywordDensity = calculateKeywordDensity(content, targetKeyword);
  
  const suggestions = [];
  
  if (wordCount < 300) {
    suggestions.push('Content is too short. Aim for at least 300 words for better SEO.');
  }
  
  if (keywordDensity < 1) {
    suggestions.push(`Keyword density is too low (${keywordDensity.toFixed(2)}%). Include the target keyword more naturally.`);
  } else if (keywordDensity > 4) {
    suggestions.push(`Keyword density is too high (${keywordDensity.toFixed(2)}%). Reduce keyword usage to avoid over-optimization.`);
  }
  
  if (!content.toLowerCase().includes(targetKeyword.toLowerCase())) {
    suggestions.push('Target keyword not found in content. Include it naturally in the text.');
  }
  
  return suggestions;
}

// Internal linking strategy
export function generateInternalLinks(currentPage: string, allPages: string[]) {
  // Logic to suggest relevant internal links based on content similarity
  // This is a simplified version - in production, you'd use more sophisticated matching
  return allPages
    .filter(page => page !== currentPage)
    .slice(0, 5) // Limit to 5 suggestions
    .map(page => ({
      url: page,
      anchor: `Related: ${page.split('/').pop()?.replace('-', ' ')}`
    }));
}
