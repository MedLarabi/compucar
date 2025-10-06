import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Calculate average rating using ProductReview model
    const avgRating = await prisma.productReview.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    });

    // Remove stock/quantity information from public API
    const { quantity, trackQuantity, allowBackorder, ...publicProduct } = product;
    
    // Also remove quantity from variants
    const variantsWithoutStock = product.variants?.map(variant => {
      const { quantity: variantQuantity, ...publicVariant } = variant;
      return publicVariant;
    });

    const productWithRating = {
      ...publicProduct,
      variants: variantsWithoutStock,
      averageRating: avgRating._avg.rating || 0,
      // Only show if item is available or not
      isAvailable: quantity > 0
    };

    return NextResponse.json(productWithRating);
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
