import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { serializeProduct } from "@/lib/utils/serialization";
import ProductPageClient from "./product-page-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Static generation for better performance
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      status: 'ACTIVE'
    },
    select: { slug: true },
    take: 100, // Generate top 100 products statically
  });

  return products.map((product) => ({
    slug: product.slug,
  }));
}

// ISR - Revalidate every hour
export const revalidate = 3600;

// Metadata generation
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      shortDescription: true,
      price: true,
      images: {
        take: 1,
        orderBy: { sortOrder: 'asc' }
      },
      category: {
        select: { name: true }
      }
    }
  });

  if (!product) {
    return {
      title: 'Product Not Found | CompuCar',
    };
  }

  const description = product.shortDescription || product.description?.substring(0, 160) || '';
  
  return {
    title: `${product.name} | CompuCar`,
    description: description,
    openGraph: {
      title: product.name,
      description: description,
      images: product.images && product.images.length > 0 ? [product.images[0].url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description,
      images: product.images && product.images.length > 0 ? [product.images[0].url] : [],
    },
  };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
      videos: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" }
          }
        }
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

  if (!product) {
    return null;
  }

  // Debug logging
  console.log("Product fetched:", {
    id: product.id,
    name: product.name,
    slug: product.slug,
    imagesCount: product.images.length,
    videosCount: product.videos.length,
    videos: product.videos.map(v => ({
      id: v.id,
      url: v.url,
      title: v.title,
    })),
  });

  // Calculate average rating
  const avgRating = await prisma.productReview.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
  });

  // Remove internal fields and add computed ones
  const { quantity, trackQuantity, allowBackorder, ...publicProduct } = product;
  
  const variantsWithoutStock = product.variants?.map(variant => {
    const { quantity: variantQuantity, ...publicVariant } = variant;
    return {
      ...publicVariant,
      inStock: variantQuantity > 0,
      stockLevel: variantQuantity > 10 ? 'high' : variantQuantity > 0 ? 'low' : 'out'
    };
  });

  // Calculate availability - if has variants, check if any variant has stock, otherwise check main product stock
  let isAvailable = false;
  if (product.variants && product.variants.length > 0) {
    // Has variants - check if any variant has stock
    isAvailable = product.variants.some(variant => variant.quantity > 0);
  } else {
    // No variants - check main product stock
    isAvailable = quantity > 0;
  }

  const productWithComputedFields = {
    ...publicProduct,
    variants: variantsWithoutStock,
    averageRating: avgRating._avg.rating || 0,
    isAvailable
  };

  // Serialize all Decimal and Date objects for client component compatibility
  return serializeProduct(productWithComputedFields);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}