import { Metadata } from 'next';
import { prisma } from '@/lib/database/prisma';
import { generateBlogArticleStructuredData } from '@/lib/seo/structured-data';

export async function generateBlogMetadata(slug: string): Promise<Metadata> {
  try {
    const article = await prisma.blogArticle.findFirst({
      where: {
        slug,
        isPublished: true,
        status: 'PUBLISHED'
      },
      include: {
        author: true,
        category: true,
        tags: true
      }
    });

    if (!article) {
      return {
        title: 'Article Not Found | CompuCar Blog',
        description: 'The article you are looking for was not found.',
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compucar.com';
    const articleUrl = `${baseUrl}/blog/${article.slug}`;
    
    // SEO-optimized title
    const title = article.metaTitle || `${article.title} | CompuCar Blog`;
    
    // SEO-optimized description
    const description = article.metaDescription || 
      article.excerpt || 
      (article.content.length > 150 
        ? `${article.content.replace(/<[^>]*>/g, '').substring(0, 147)}...`
        : article.content.replace(/<[^>]*>/g, ''));

    // Generate keywords
    const keywords = [
      article.tags.map(tag => tag.name).join(', '),
      article.category?.name,
      'automotive blog',
      'car tips',
      'auto advice',
      'CompuCar'
    ].filter(Boolean).join(', ');

    const authorName = article.author.name || 
      `${article.author.firstName} ${article.author.lastName}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: articleUrl,
        type: 'article',
        publishedTime: article.publishedAt?.toISOString(),
        modifiedTime: article.updatedAt.toISOString(),
        authors: [authorName],
        section: article.category?.name || 'Automotive',
        tags: article.tags.map(tag => tag.name),
        images: [
          {
            url: article.featuredImage || `${baseUrl}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: article.imageAlt || article.title,
          }
        ],
        siteName: 'CompuCar Blog',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: article.featuredImage || `${baseUrl}/og-image.jpg`,
        creator: '@compucar',
      },
      alternates: {
        canonical: articleUrl,
      },
      other: {
        'article:author': authorName,
        'article:section': article.category?.name || 'Automotive',
        'article:published_time': article.publishedAt?.toISOString(),
        'article:modified_time': article.updatedAt.toISOString(),
        'article:tag': article.tags.map(tag => tag.name).join(','),
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
    console.error('Error generating blog metadata:', error);
    return {
      title: 'CompuCar Blog - Automotive Tips & Insights',
      description: 'Expert automotive advice, tips, and insights.',
    };
  }
}
