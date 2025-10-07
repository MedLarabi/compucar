import { Metadata } from 'next';
import { prisma } from '@/lib/database/prisma';
import { generateProductStructuredData } from '@/lib/seo/structured-data';

export async function generateProductMetadata(slug: string): Promise<Metadata> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        reviews: {
          where: { isApproved: true },
          select: { rating: true }
        }
      }
    });

    if (!product) {
      return {
        title: 'Product Not Found | CompuCar',
        description: 'The product you are looking for was not found.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
    const productUrl = `${baseUrl}/products/${product.slug}`;
    
    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // SEO-optimized title (under 60 characters)
    const title = `${product.name} | CompuCar Auto Parts`;
    
    // SEO-optimized description (under 160 characters)
    const description = product.description.length > 150 
      ? `${product.description.substring(0, 147)}...`
      : product.description;

    // Generate keywords
    const keywords = [
      product.name.toLowerCase(),
      product.category?.name.toLowerCase(),
      product.brand?.toLowerCase(),
      'automotive parts',
      'car accessories',
      'auto parts',
      product.sku?.toLowerCase()
    ].filter(Boolean).join(', ');

    const structured = generateProductStructuredData(product);

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: productUrl,
        type: 'website',
        images: [
          {
            url: product.images?.[0]?.url || `${baseUrl}/placeholder-product.jpg`,
            width: 800,
            height: 600,
            alt: product.name,
          }
        ],
        siteName: 'CompuCar',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.images?.[0] || `${baseUrl}/placeholder-product.jpg`,
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        'product:brand': product.brand || 'CompuCar',
        'product:availability': product.quantity > 0 ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'DZD',
        'product:rating:value': avgRating.toString(),
        'product:rating:count': product.reviews.length.toString(),
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    return {
      title: 'CompuCar - Premium Automotive Parts',
      description: 'Discover premium automotive parts and accessories.',
    };
  }
}
