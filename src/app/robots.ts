import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products/',
          '/blog/',
          '/categories/',
          '/contact',
          '/about',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/static/',
          '/account/',
          '/checkout/',
          '/cart',
          '/wishlist',
          '/auth/',
          '/dashboard/',
          '/upload-test',
          '/auth-test',
          '/unauthorized',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/checkout/',
          '/cart',
          '/wishlist',
          '/auth/',
          '/dashboard/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/checkout/',
          '/cart',
          '/wishlist',
          '/auth/',
          '/dashboard/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
