import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface ProductSEOData {
  name: string;
  description: string;
  price: number;
  currency: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'used' | 'refurbished';
  brand?: string;
  category?: string;
  images: string[];
  sku?: string;
  gtin?: string;
  mpn?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface OrganizationSEOData {
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
  sameAs?: string[];
}

export class SEOMetadata {
  private static baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
  private static defaultImage = `${this.baseUrl}/og-image.jpg`;
  private static defaultDescription = 'CompuCar - Your trusted source for computer parts and accessories. Find the best deals on CPUs, GPUs, motherboards, and more.';
  private static defaultKeywords = ['computer parts', 'PC components', 'gaming hardware', 'computer accessories', 'tech store'];

  /**
   * Generate basic metadata
   */
  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      image,
      url,
      type = 'website',
      publishedTime,
      modifiedTime,
      author,
      section,
      tags = []
  } = config;

    const fullTitle = title.includes('CompuCar') ? title : `${title} | CompuCar`;
    const fullDescription = description || this.defaultDescription;
    const fullKeywords = [...this.defaultKeywords, ...keywords].join(', ');
    const fullImage = image || this.defaultImage;
    const fullUrl = url ? `${this.baseUrl}${url}` : this.baseUrl;

    return {
      title: fullTitle,
      description: fullDescription,
      keywords: fullKeywords,
      authors: author ? [{ name: author }] : undefined,
      creator: 'CompuCar',
      publisher: 'CompuCar',
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        title: fullTitle,
        description: fullDescription,
        url: fullUrl,
        siteName: 'CompuCar',
        images: [
          {
            url: fullImage,
            width: 1200,
            height: 630,
            alt: fullTitle,
          },
        ],
        locale: 'en_US',
        type,
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        section,
        tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description: fullDescription,
        images: [fullImage],
        creator: '@compucar',
        site: '@compucar',
      },
      alternates: {
        canonical: fullUrl,
      },
      other: {
        'theme-color': '#000000',
        'color-scheme': 'dark light',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': 'CompuCar',
        'application-name': 'CompuCar',
        'msapplication-TileColor': '#000000',
        'msapplication-config': '/browserconfig.xml',
      },
    };
  }

  /**
   * Generate product metadata
   */
  static generateProductMetadata(
    product: ProductSEOData,
    url: string
  ): Metadata {
    const config: SEOConfig = {
      title: product.name,
      description: product.description,
      keywords: [product.brand, product.category, 'computer parts', 'PC components'].filter(Boolean) as string[],
      image: product.images[0],
      url,
      type: 'product',
    };

    const metadata = this.generateMetadata(config);

    // Add product-specific structured data
    const structuredData = this.generateProductStructuredData(product, url);

    return {
      ...metadata,
      other: {
        ...metadata.other,
        'product:price:amount': product.price.toString(),
        'product:price:currency': product.currency,
        'product:availability': product.availability,
        'product:condition': product.condition,
        'product:brand': product.brand,
        'product:category': product.category,
        'product:retailer_item_id': product.sku,
        'product:gtin': product.gtin,
        'product:mpn': product.mpn,
      },
      alternates: {
        ...metadata.alternates,
        'structured-data': JSON.stringify(structuredData),
      },
    };
  }

  /**
   * Generate category metadata
   */
  static generateCategoryMetadata(
    categoryName: string,
    categoryDescription: string,
    url: string,
    productCount?: number
  ): Metadata {
    const config: SEOConfig = {
      title: `${categoryName} Computer Parts`,
      description: categoryDescription,
      keywords: [categoryName, 'computer parts', 'PC components'],
      url,
      type: 'website',
    };

    const metadata = this.generateMetadata(config);

    if (productCount) {
      metadata.description += ` Browse our selection of ${productCount} ${categoryName.toLowerCase()} products.`;
    }

    return metadata;
  }

  /**
   * Generate search results metadata
   */
  static generateSearchMetadata(
    query: string,
    resultCount: number,
    url: string
  ): Metadata {
    const config: SEOConfig = {
      title: `Search Results for "${query}"`,
      description: `Find ${resultCount} results for "${query}" in our computer parts store.`,
      keywords: [query, 'search', 'computer parts'],
      url,
      type: 'website',
    };

    return this.generateMetadata(config);
  }

  /**
   * Generate JSON-LD structured data for products
   */
  static generateProductStructuredData(
    product: ProductSEOData,
    url: string
  ): object {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      url: `${this.baseUrl}${url}`,
      brand: product.brand ? {
        '@type': 'Brand',
        name: product.brand,
      } : undefined,
      category: product.category,
      sku: product.sku,
      gtin: product.gtin,
      mpn: product.mpn,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: `https://schema.org/${product.availability.replace(' ', '')}`,
        itemCondition: `https://schema.org/${product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}Condition`,
        url: `${this.baseUrl}${url}`,
      },
      image: product.images.map(image => `${this.baseUrl}${image}`),
    };

    if (product.aggregateRating) {
      structuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.reviewCount,
      };
    }

    return structuredData;
  }

  /**
   * Generate JSON-LD structured data for organization
   */
  static generateOrganizationStructuredData(
    organization: OrganizationSEOData
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
      logo: organization.logo,
      description: organization.description,
      address: organization.address ? {
        '@type': 'PostalAddress',
        streetAddress: organization.address.streetAddress,
        addressLocality: organization.address.addressLocality,
        addressRegion: organization.address.addressRegion,
        postalCode: organization.address.postalCode,
        addressCountry: organization.address.addressCountry,
      } : undefined,
      contactPoint: organization.contactPoint ? {
        '@type': 'ContactPoint',
        telephone: organization.contactPoint.telephone,
        contactType: organization.contactPoint.contactType,
      } : undefined,
      sameAs: organization.sameAs,
    };
  }

  /**
   * Generate JSON-LD structured data for breadcrumbs
   */
  static generateBreadcrumbStructuredData(
    breadcrumbs: Array<{ name: string; url: string }>
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: `${this.baseUrl}${breadcrumb.url}`,
      })),
    };
  }

  /**
   * Generate JSON-LD structured data for FAQ
   */
  static generateFAQStructuredData(
    faqs: Array<{ question: string; answer: string }>
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate sitemap data
   */
  static generateSitemapData(
    pages: Array<{ url: string; lastModified?: Date; changeFrequency?: string; priority?: number }>
  ): string {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${this.baseUrl}${page.url}</loc>
    <lastmod>${page.lastModified?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>${page.changeFrequency || 'weekly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`).join('\n')}
</urlset>`;

    return sitemap;
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important pages
Allow: /products/
Allow: /categories/
Allow: /search

# Crawl delay (optional)
Crawl-delay: 1`;
  }

  /**
   * Generate meta tags for social sharing
   */
  static generateSocialMetaTags(config: SEOConfig): Record<string, string> {
    const {
      title,
      description,
      image,
      url,
      type = 'website',
    } = config;

    const fullTitle = title.includes('CompuCar') ? title : `${title} | CompuCar`;
    const fullDescription = description || this.defaultDescription;
    const fullImage = image || this.defaultImage;
    const fullUrl = url ? `${this.baseUrl}${url}` : this.baseUrl;

    return {
      'og:title': fullTitle,
      'og:description': fullDescription,
      'og:image': fullImage,
      'og:url': fullUrl,
      'og:type': type,
      'og:site_name': 'CompuCar',
      'og:locale': 'en_US',
      'twitter:card': 'summary_large_image',
      'twitter:title': fullTitle,
      'twitter:description': fullDescription,
      'twitter:image': fullImage,
      'twitter:site': '@compucar',
      'twitter:creator': '@compucar',
    };
  }
}
