import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { productSchema } from "@/lib/schemas/product-schema";
import { serializeForClient } from "@/lib/utils/serialization";
// Temporarily disable optimized queries to debug webpack issues
// import { getProducts } from "@/lib/database/optimized-queries";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Products API called:', request.url);
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const featured = searchParams.get('featured') === 'true';

    // Add cache headers for performance
    const isFirstPage = page === 1 && !search;
    const cacheControl = isFirstPage 
      ? 'public, s-maxage=300, stale-while-revalidate=600' // 5 minutes for first page
      : 'public, s-maxage=60, stale-while-revalidate=120';  // 1 minute for others

    // Handle specific product IDs request (bypass cache for specific IDs)
    if (ids) {
      const productIds = ids.split(',').filter(id => id.trim());
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
          status: 'ACTIVE'
        },
        include: {
          category: {
            select: { name: true, slug: true },
          },
          images: {
            orderBy: { sortOrder: "asc" },
            select: { url: true, altText: true, sortOrder: true },
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, price: true },
          },
          tags: {
            select: { 
              name: true,
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, rating: true, content: true, createdAt: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
      });

      // Calculate average ratings efficiently
      const productRatings = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
      });

      const ratingsMap = new Map(
        productRatings.map(r => [r.productId, r._avg.rating || 0])
      );

      const productsWithRatings = products.map(product => ({
        ...product,
        price: typeof product.price === 'object' && product.price !== null && 'toNumber' in product.price ? product.price.toNumber() : Number(product.price),
        compareAtPrice: product.compareAtPrice ? (typeof product.compareAtPrice === 'object' && product.compareAtPrice !== null && 'toNumber' in product.compareAtPrice ? product.compareAtPrice.toNumber() : Number(product.compareAtPrice)) : null,
        images: product.images?.map((img: any) => ({
          url: img.url,
          alt: img.altText ?? null,
          sortOrder: img.sortOrder,
        })) ?? [],
        averageRating: ratingsMap.get(product.id) || 0,
      }));

      return NextResponse.json({
        success: true,
        data: serializeForClient(productsWithRatings),
      }, {
        headers: {
          'Cache-Control': cacheControl,
        },
      });
    }

    // Use simple direct database query to debug webpack issues
    const skip = (page - 1) * limit;
    
    const where: any = {
      isActive: true,
      status: 'ACTIVE'
    };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true, slug: true },
          },
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            select: { url: true, altText: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const normalized = products.map((p: any) => ({
      ...p,
      price: typeof p.price === 'object' && p.price !== null && 'toNumber' in p.price ? p.price.toNumber() : Number(p.price),
      compareAtPrice: p.compareAtPrice ? (typeof p.compareAtPrice === 'object' && p.compareAtPrice !== null && 'toNumber' in p.compareAtPrice ? p.compareAtPrice.toNumber() : Number(p.compareAtPrice)) : null,
      images: p.images?.map((img: any) => ({ url: img.url, alt: img.altText ?? null })) ?? [],
    }));

    const result = {
      success: true,
      data: serializeForClient(normalized),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
      },
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': cacheControl,
      },
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);
    
    // Transform the data for Prisma
    const { images, tags, ...productData } = validatedData;
    
    const product = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: images.map((url, index) => ({
            url,
            sortOrder: index,
            alt: `${productData.name} image ${index + 1}`,
          })),
        },
        tags: {
          create: tags.map((name) => ({
            name,
          })),
        },
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
        tags: {
          select: { name: true },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: serializeForClient(product),
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}