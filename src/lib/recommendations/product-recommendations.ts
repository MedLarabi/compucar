import { prisma } from "@/lib/database/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
}

export interface UserBehavior {
  userId: string;
  productId: string;
  action: 'view' | 'purchase' | 'cart' | 'wishlist';
  timestamp: Date;
}

export class ProductRecommendations {
  /**
   * Get personalized recommendations based on user's purchase history
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get user's purchase history
      const userOrders = await prisma.order.findMany({
        where: {
          userId,
          status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] }
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  category: true,
                  tags: true
                }
              }
            }
          }
        }
      });

      if (userOrders.length === 0) {
        // If no purchase history, return popular products
        return this.getPopularProducts(limit);
      }

      // Extract purchased product categories and tags
      const purchasedCategories = new Set<string>();
      const purchasedTags = new Set<string>();
      const purchasedProductIds = new Set<string>();

      userOrders.forEach(order => {
        order.orderItems.forEach(item => {
          purchasedProductIds.add(item.productId);
          purchasedCategories.add(item.product.categoryId);
          item.product.tags.forEach(tag => {
            purchasedTags.add(tag.name);
          });
        });
      });

      // Find similar products based on categories and tags
      const similarProducts = await prisma.product.findMany({
        where: {
          id: { notIn: Array.from(purchasedProductIds) },
          isActive: true,
          status: 'ACTIVE',
          OR: [
            { categoryId: { in: Array.from(purchasedCategories) } },
            {
              tags: {
                some: {
                  name: { in: Array.from(purchasedTags) }
                }
              }
            }
          ]
        },
        include: {
          category: true,
          tags: true,
          reviews: true,
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        take: limit * 2 // Get more to filter by score
      });

      // Score products based on similarity
      const scoredProducts = similarProducts.map(product => {
        let score = 0;
        
        // Category match
        if (purchasedCategories.has(product.categoryId)) {
          score += 3;
        }

        // Tag matches
        const tagMatches = product.tags.filter(tag => 
          purchasedTags.has(tag.name)
        ).length;
        score += tagMatches * 2;

        // Popularity bonus
        score += Math.min(product._count.orderItems, 10);

        // Rating bonus
        if (product.reviews.length > 0) {
          const avgRating = product.reviews.reduce((sum, review) => 
            sum + review.rating, 0
          ) / product.reviews.length;
          score += avgRating * 0.5;
        }

        return {
          productId: product.id,
          score,
          reason: this.generateRecommendationReason(product, purchasedCategories, purchasedTags)
        };
      });

      // Sort by score and return top results
      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return this.getPopularProducts(limit);
    }
  }

  /**
   * Get recommendations based on a specific product
   */
  static async getProductBasedRecommendations(
    productId: string,
    limit: number = 8
  ): Promise<RecommendationResult[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          tags: true
        }
      });

      if (!product) {
        return this.getPopularProducts(limit);
      }

      // Find products in same category or with similar tags
      const similarProducts = await prisma.product.findMany({
        where: {
          id: { not: productId },
          isActive: true,
          status: 'ACTIVE',
          OR: [
            { categoryId: product.categoryId },
            {
              tags: {
                some: {
                  name: {
                    in: product.tags.map(tag => tag.name)
                  }
                }
              }
            }
          ]
        },
        include: {
          category: true,
          tags: true,
          reviews: true,
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        take: limit * 2
      });

      // Score products based on similarity
      const scoredProducts = similarProducts.map(similarProduct => {
        let score = 0;
        
        // Same category
        if (similarProduct.categoryId === product.categoryId) {
          score += 5;
        }

        // Tag similarity
        const commonTags = product.tags.filter(tag =>
          similarProduct.tags.some(similarTag => similarTag.name === tag.name)
        ).length;
        score += commonTags * 3;

        // Price similarity (within 20% range)
        const priceDiff = Math.abs(
          Number(similarProduct.price) - Number(product.price)
        ) / Number(product.price);
        if (priceDiff <= 0.2) {
          score += 2;
        }

        // Popularity and rating
        score += Math.min(similarProduct._count.orderItems, 10);
        if (similarProduct.reviews.length > 0) {
          const avgRating = similarProduct.reviews.reduce((sum, review) => 
            sum + review.rating, 0
          ) / similarProduct.reviews.length;
          score += avgRating * 0.5;
        }

        return {
          productId: similarProduct.id,
          score,
          reason: `Similar to ${product.name}`
        };
      });

      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting product-based recommendations:', error);
      return this.getPopularProducts(limit);
    }
  }

  /**
   * Get popular products based on sales and views
   */
  static async getPopularProducts(limit: number = 10): Promise<RecommendationResult[]> {
    try {
      const popularProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          status: 'PUBLISHED'
        },
        include: {
          _count: {
            select: {
              orderItems: true
            }
          },
          reviews: true
        },
        orderBy: [
          {
            orderItems: {
              _count: 'desc'
            }
          },
          {
            reviews: {
              _count: 'desc'
            }
          }
        ],
        take: limit
      });

      return popularProducts.map((product, index) => ({
        productId: product.id,
        score: 100 - index, // Higher score for higher ranked products
        reason: 'Popular product'
      }));

    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  /**
   * Get trending products (recently popular)
   */
  static async getTrendingProducts(limit: number = 8): Promise<RecommendationResult[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          orderItems: {
            some: {
              order: {
                createdAt: {
                  gte: thirtyDaysAgo
                }
              }
            }
          }
        },
        include: {
          _count: {
            select: {
              orderItems: {
                where: {
                  order: {
                    createdAt: {
                      gte: thirtyDaysAgo
                    }
                  }
                }
              }
            }
          },
          reviews: {
            where: {
              createdAt: {
                gte: thirtyDaysAgo
              }
            }
          }
        },
        orderBy: [
          {
            orderItems: {
              _count: 'desc'
            }
          }
        ],
        take: limit
      });

      return trendingProducts.map((product, index) => ({
        productId: product.id,
        score: 100 - index,
        reason: 'Trending product'
      }));

    } catch (error) {
      console.error('Error getting trending products:', error);
      return this.getPopularProducts(limit);
    }
  }

  /**
   * Get recommendations for new users (cold start)
   */
  static async getNewUserRecommendations(limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Get featured products and highly rated products
      const newUserProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          OR: [
            { isFeatured: true },
            {
              reviews: {
                some: {
                  rating: { gte: 4 }
                }
              }
            }
          ]
        },
        include: {
          reviews: true,
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          {
            reviews: {
              _count: 'desc'
            }
          }
        ],
        take: limit
      });

      return newUserProducts.map((product, index) => ({
        productId: product.id,
        score: 100 - index,
        reason: product.isFeatured ? 'Featured product' : 'Highly rated product'
      }));

    } catch (error) {
      console.error('Error getting new user recommendations:', error);
      return this.getPopularProducts(limit);
    }
  }

  /**
   * Generate recommendation reason for display
   */
  private static generateRecommendationReason(
    product: any,
    purchasedCategories: Set<string>,
    purchasedTags: Set<string>
  ): string {
    const reasons = [];

    if (purchasedCategories.has(product.categoryId)) {
      reasons.push('Based on your category preferences');
    }

    const commonTags = product.tags.filter(tag => 
      purchasedTags.has(tag.name)
    );
    if (commonTags.length > 0) {
      reasons.push(`Similar to products you've purchased`);
    }

    if (product.isFeatured) {
      reasons.push('Featured product');
    }

    if (product.reviews.length > 0) {
      const avgRating = product.reviews.reduce((sum, review) => 
        sum + review.rating, 0
      ) / product.reviews.length;
      if (avgRating >= 4) {
        reasons.push('Highly rated');
      }
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Recommended for you';
  }

  /**
   * Track user behavior for improving recommendations
   */
  static async trackUserBehavior(
    userId: string,
    productId: string,
    action: 'view' | 'purchase' | 'cart' | 'wishlist'
  ): Promise<void> {
    try {
      // In a real implementation, you would store this in a separate table
      // For now, we'll just log it for demonstration
      console.log(`User ${userId} performed ${action} on product ${productId}`);
      
      // You could implement a more sophisticated tracking system here
      // such as storing in Redis for real-time recommendations
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  }
}
