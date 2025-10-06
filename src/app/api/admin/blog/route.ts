import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { auth } from "@/lib/auth/config";
import { z } from "zod";

const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  featuredImage: z.string().optional(),
  imageAlt: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isPublished: z.boolean().default(false),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// Helper function to estimate read time
function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET - Fetch all articles for admin (including drafts)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const authorId = searchParams.get('authorId');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [articles, total] = await Promise.all([
      prisma.blogArticle.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              image: true,
              email: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          tags: {
            select: {
              id: true,
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
          { updatedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.blogArticle.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);

    // Generate slug if not provided
    if (!validatedData.slug) {
      validatedData.slug = generateSlug(validatedData.title);
    }

    // Check if slug already exists
    const existingArticle = await prisma.blogArticle.findUnique({
      where: { slug: validatedData.slug }
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      );
    }

    // Calculate read time
    const readTime = estimateReadTime(validatedData.content);

    // Set published date if publishing
    const publishedAt = validatedData.isPublished ? new Date() : null;

    // Create article
    const article = await prisma.blogArticle.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        featuredImage: validatedData.featuredImage,
        imageAlt: validatedData.imageAlt,
        status: validatedData.status,
        isPublished: validatedData.isPublished,
        publishedAt,
        authorId: session.user.id,
        categoryId: validatedData.categoryId,
        readTime,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
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
        category: true
      }
    });

    // Handle tags
    if (validatedData.tags.length > 0) {
      const tagPromises = validatedData.tags.map(async (tagName) => {
        const tagSlug = generateSlug(tagName);
        
        return prisma.blogTag.create({
          data: {
            name: tagName,
            slug: tagSlug,
            articleId: article.id
          }
        });
      });

      await Promise.all(tagPromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Article created successfully',
      data: article
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
