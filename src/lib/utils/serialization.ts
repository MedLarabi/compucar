import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serializes Prisma objects for client components by converting:
 * - Decimal objects to numbers
 * - Date objects to ISO strings
 * - BigInt to numbers
 */
export function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as T;
  }

  if (obj instanceof Decimal) {
    const num = Number(obj);
    return (isNaN(num) ? 0 : num) as T;
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeForClient(item)) as T;
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeForClient(value);
    }
    return serialized as T;
  }

  return obj;
}

/**
 * Helper function to safely convert values to numbers
 */
function safeNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && 'toNumber' in value) {
    const num = value.toNumber();
    return isNaN(num) ? 0 : num;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Specifically for product serialization with known field mapping
 */
export function serializeProduct(product: any) {
  if (!product) return product;
  
  return {
    ...product,
    // Convert Decimal objects to numbers with safe conversion
    price: safeNumber(product.price),
    compareAtPrice: product.compareAtPrice ? safeNumber(product.compareAtPrice) : null,
    cost: product.cost ? safeNumber(product.cost) : null,
    weight: product.weight ? safeNumber(product.weight) : null,
    length: product.length ? safeNumber(product.length) : null,
    width: product.width ? safeNumber(product.width) : null,
    height: product.height ? safeNumber(product.height) : null,
    
    // Convert Date objects to ISO strings
    createdAt: product.createdAt?.toISOString(),
    updatedAt: product.updatedAt?.toISOString(),
    publishedAt: product.publishedAt?.toISOString() || null,
    
    // Handle related objects
    variants: product.variants?.map((variant: any) => ({
      ...variant,
      price: safeNumber(variant.price),
      compareAtPrice: variant.compareAtPrice ? safeNumber(variant.compareAtPrice) : null,
      createdAt: variant.createdAt?.toISOString(),
      updatedAt: variant.updatedAt?.toISOString(),
    })),
    
    reviews: product.reviews?.map((review: any) => ({
      ...review,
      createdAt: review.createdAt?.toISOString(),
      updatedAt: review.updatedAt?.toISOString(),
    })),
    
    // Convert other potential Decimal/numeric fields
    averageRating: safeNumber(product.averageRating),
  };
}
