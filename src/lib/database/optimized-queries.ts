import { prisma } from "@/lib/database/prisma";
import { serializeForClient } from "@/lib/utils/serialization";
// Temporarily disable caching to debug webpack issues
// import { cache, withCache, CACHE_DURATIONS } from "@/lib/cache/redis-cache";

// Optimized product queries with caching
export async function getProducts({
  page = 1,
  limit = 12,
  category,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  minPrice,
  maxPrice,
  featured,
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}) {
  // Temporarily disable caching to debug webpack issues
  // const cacheKey = cache.generateKey(
  //   'products',
  //   page,
  //   limit,
  //   category || 'all',
  //   search || 'none',
  //   sortBy,
  //   sortOrder,
  //   minPrice || 0,
  //   maxPrice || 999999,
  //   featured || false
  // );

  // return withCache(
  //   cacheKey,
  //   async () => {
  try {
      const skip = (page - 1) * limit;

      // Build optimized where clause
      const where: any = {
        isActive: true,
        status: 'ACTIVE',
      };

      if (category) {
        where.category = { slug: category };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = minPrice;
        if (maxPrice) where.price.lte = maxPrice;
      }

      // Featured logic could be implemented based on existing fields
      // For now, we'll use the featured parameter to prioritize newer products
      if (featured) {
        // Could implement featured logic here based on your business rules
      }

      // Optimized sort order
      const orderBy: any = {};
      if (sortBy === 'price') {
        orderBy.price = sortOrder;
      } else if (sortBy === 'name') {
        orderBy.name = sortOrder;
      } else if (sortBy === 'rating') {
        orderBy.averageRating = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Execute optimized queries in parallel
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

      // Get average ratings for products (batched query)
      const productIds = products.map(p => p.id);
      const ratings = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
      });

      const ratingsMap = new Map(
        ratings.map(r => [r.productId, r._avg.rating || 0])
      );

      const productsWithRatings = products.map(product => ({
        ...product,
        images: product.images?.map((img: any) => ({
          url: img.url,
          alt: img.altText ?? null,
        })) ?? [],
        averageRating: ratingsMap.get(product.id) || 0,
      }));

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: serializeForClient(productsWithRatings),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      };
    }
    // },
    // CACHE_DURATIONS.PRODUCTS
    // );
}

// Optimized single product query
export async function getProductBySlug(slug: string) {
  // Temporarily disable caching
  // const cacheKey = cache.generateKey('product', slug);

  // return withCache(
  //   cacheKey,
  //   async () => {
  try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: "asc" },
          },
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
          tags: true,
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: { reviews: true },
          },
        },
      });

      if (!product) return null;

      // Calculate average rating
      const avgRating = await prisma.productReview.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
      });

      const productWithRating = {
        ...product,
        averageRating: avgRating._avg.rating || 0,
      };

      return serializeForClient(productWithRating);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    // },
    // CACHE_DURATIONS.PRODUCT_DETAIL
    // );
}

// Optimized categories query
export async function getCategories() {
  // const cacheKey = cache.generateKey('categories', 'all');

  // return withCache(
  //   cacheKey,
  //   async () => {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { 
              products: {
                where: {
                  isActive: true,
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return serializeForClient(categories);
  // },
  // CACHE_DURATIONS.CATEGORIES
  // );
}

// Optimized search with autocomplete
export async function searchProducts(query: string, limit = 10) {
  // const cacheKey = cache.generateKey('search', query, limit);

  // return withCache(
  //   cacheKey,
  //   async () => {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { shortDescription: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            select: { url: true, altText: true },
          },
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      });

      return serializeForClient(products);
  // },
  // CACHE_DURATIONS.SEARCH_RESULTS
  // );
}

// Cache invalidation helpers
export async function invalidateProductCache(productId?: string, slug?: string) {
  // Temporarily disabled caching
  // if (productId) {
  //   await cache.delete(cache.generateKey('product', productId));
  // }
  // if (slug) {
  //   await cache.delete(cache.generateKey('product', slug));
  // }
  
  // // Clear related caches
  // await cache.delete(cache.generateKey('products', '*'));
  // await cache.delete(cache.generateKey('categories', 'all'));
}

export async function invalidateCategoryCache() {
  // Temporarily disabled caching
  // await cache.delete(cache.generateKey('categories', 'all'));
  // await cache.delete(cache.generateKey('products', '*'));
}
