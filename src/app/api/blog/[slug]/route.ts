import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const article = await prisma.blogArticle.findFirst({
      where: {
        slug,
        isPublished: true,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
            image: true,
            bio: true
          }
        },
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
            description: true
          }
        },
        tags: {
          select: {
            name: true,
            slug: true,
            color: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.blogArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    });

    // Get related articles (same category, excluding current)
    const relatedArticles = await prisma.blogArticle.findMany({
      where: {
        isPublished: true,
        status: 'PUBLISHED',
        categoryId: article.categoryId,
        id: { not: article.id }
      },
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
        }
      },
      take: 3,
      orderBy: { publishedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        views: article.views + 1, // Include the incremented view count
        relatedArticles: relatedArticles.map(related => ({
          id: related.id,
          title: related.title,
          slug: related.slug,
          excerpt: related.excerpt,
          featuredImage: related.featuredImage,
          imageAlt: related.imageAlt,
          publishedAt: related.publishedAt,
          readTime: related.readTime,
          author: related.author,
          category: related.category
        }))
      }
    });

  } catch (error) {
    console.error("Blog article fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}
