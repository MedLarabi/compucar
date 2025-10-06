import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { ProductRecommendations } from "@/lib/recommendations/product-recommendations";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'personalized';
    const limit = parseInt(searchParams.get('limit') || '10');
    const productId = searchParams.get('productId');

    let recommendations: any[] = [];

    switch (type) {
      case 'personalized':
        if (!session?.user?.id) {
          recommendations = await ProductRecommendations.getNewUserRecommendations(limit);
        } else {
          recommendations = await ProductRecommendations.getPersonalizedRecommendations(
            session.user.id,
            limit
          );
        }
        break;

      case 'product-based':
        if (!productId) {
          return NextResponse.json(
            { error: "Product ID is required for product-based recommendations" },
            { status: 400 }
          );
        }
        recommendations = await ProductRecommendations.getProductBasedRecommendations(
          productId,
          limit
        );
        break;

      case 'popular':
        recommendations = await ProductRecommendations.getPopularProducts(limit);
        break;

      case 'trending':
        recommendations = await ProductRecommendations.getTrendingProducts(limit);
        break;

      case 'new-user':
        recommendations = await ProductRecommendations.getNewUserRecommendations(limit);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid recommendation type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      type,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
