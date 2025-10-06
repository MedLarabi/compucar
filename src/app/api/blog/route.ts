import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    
    const skip = (page - 1) * limit;

    // Build where clause for published articles only
    const where: any = {
      isPublished: true,
      status: 'PUBLISHED'
    };

    if (category) {
      where.category = {
        slug: category
      };
    }

    if (tag) {
      where.tags = {
        some: {
          slug: tag
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (featured) {
      // You can add a featured field later or use likes/views for now
      where.likes = { gte: 10 };
    }

    const [articles, total] = await Promise.all([
      prisma.blogArticle.findMany({
        where,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              name: true,
              image: true
            }
          },
          category: {
            select: {
              name: true,
              slug: true,
              color: true
            }
          },
          tags: {
            select: {
              name: true,
              slug: true,
              color: true
            }
          },
          _count: {
            select: {
              tags: true
            }
          }
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.blogArticle.count({ where })
    ]);

    // Remove sensitive content for listing
    const articlesForListing = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      imageAlt: article.imageAlt,
      publishedAt: article.publishedAt,
      readTime: article.readTime,
      views: article.views,
      likes: article.likes,
      author: article.author,
      category: article.category,
      tags: article.tags,
      _count: article._count
    }));

    return NextResponse.json({
      success: true,
      data: articlesForListing,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog articles' },
      { status: 500 }
    );
  }
}
