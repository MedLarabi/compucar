import { prisma } from "@/lib/database/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export interface PromotionalCodeValidation {
  isValid: boolean;
  error?: string;
  discountAmount?: number;
  code?: any;
}

export interface CartItem {
  productId: string;
  categoryId: string;
  price: number;
  quantity: number;
}

export class PromotionalCodesService {
  /**
   * Validate and apply a promotional code
   */
  static async validateCode(
    code: string,
    userId: string,
    cartItems: CartItem[],
    subtotal: number
  ): Promise<PromotionalCodeValidation> {
    try {
      // Find the promotional code
      const promotionalCode = await prisma.promotionalCode.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!promotionalCode) {
        return {
          isValid: false,
          error: "Invalid promotional code"
        };
      }

      // Check if code is active
      if (!promotionalCode.isActive) {
        return {
          isValid: false,
          error: "This promotional code is no longer active"
        };
      }

      // Check if code has expired
      if (promotionalCode.expiresAt && promotionalCode.expiresAt < new Date()) {
        return {
          isValid: false,
          error: "This promotional code has expired"
        };
      }

      // Check if code has started
      if (promotionalCode.startsAt > new Date()) {
        return {
          isValid: false,
          error: "This promotional code is not yet active"
        };
      }

      // Check usage limit
      if (promotionalCode.usageLimit && promotionalCode.usedCount >= promotionalCode.usageLimit) {
        return {
          isValid: false,
          error: "This promotional code has reached its usage limit"
        };
      }

      // Check user usage limit
      if (promotionalCode.userUsageLimit) {
        const userUsageCount = await prisma.promotionalCodeUsage.count({
          where: {
            promotionalCodeId: promotionalCode.id,
            userId
          }
        });

        if (userUsageCount >= promotionalCode.userUsageLimit) {
          return {
            isValid: false,
            error: "You have already used this promotional code the maximum number of times"
          };
        }
      }

      // Check minimum amount
      if (promotionalCode.minimumAmount && subtotal < Number(promotionalCode.minimumAmount)) {
        return {
          isValid: false,
          error: `Minimum order amount of ${promotionalCode.minimumAmount} required`
        };
      }

      // Check if code applies to cart items
      const applicableItems = this.getApplicableItems(cartItems, promotionalCode);
      if (applicableItems.length === 0) {
        return {
          isValid: false,
          error: "This promotional code does not apply to any items in your cart"
        };
      }

      // Calculate applicable subtotal
      const applicableSubtotal = applicableItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );

      // Calculate discount amount
      const discountAmount = this.calculateDiscount(
        promotionalCode,
        applicableSubtotal
      );

      return {
        isValid: true,
        discountAmount,
        code: promotionalCode
      };

    } catch (error) {
      console.error('Error validating promotional code:', error);
      return {
        isValid: false,
        error: "Failed to validate promotional code"
      };
    }
  }

  /**
   * Apply promotional code to an order
   */
  static async applyCodeToOrder(
    codeId: string,
    userId: string,
    orderId: string,
    discountAmount: number
  ): Promise<boolean> {
    try {
      await prisma.promotionalCodeUsage.create({
        data: {
          promotionalCodeId: codeId,
          userId,
          orderId,
          discountAmount: new Decimal(discountAmount)
        }
      });

      // Increment usage count
      await prisma.promotionalCode.update({
        where: { id: codeId },
        data: {
          usedCount: {
            increment: 1
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error applying promotional code to order:', error);
      return false;
    }
  }

  /**
   * Get applicable items for a promotional code
   */
  private static getApplicableItems(
    cartItems: CartItem[],
    promotionalCode: any
  ): CartItem[] {
    return cartItems.filter(item => {
      // Check if product is excluded
      if (promotionalCode.excludedProducts.includes(item.productId)) {
        return false;
      }

      // Check if code applies to specific products
      if (promotionalCode.applicableProducts.length > 0) {
        return promotionalCode.applicableProducts.includes(item.productId);
      }

      // Check if code applies to specific categories
      if (promotionalCode.applicableCategories.length > 0) {
        return promotionalCode.applicableCategories.includes(item.categoryId);
      }

      // If no restrictions, apply to all items
      return true;
    });
  }

  /**
   * Calculate discount amount
   */
  private static calculateDiscount(
    promotionalCode: any,
    applicableSubtotal: number
  ): number {
    let discountAmount = 0;

    switch (promotionalCode.type) {
      case 'PERCENTAGE':
        discountAmount = (applicableSubtotal * Number(promotionalCode.value)) / 100;
        break;
      
      case 'FIXED_AMOUNT':
        discountAmount = Number(promotionalCode.value);
        break;
      
      case 'FREE_SHIPPING':
        // This would be handled separately in shipping calculation
        discountAmount = 0;
        break;
    }

    // Apply maximum discount limit
    if (promotionalCode.maximumDiscount && discountAmount > Number(promotionalCode.maximumDiscount)) {
      discountAmount = Number(promotionalCode.maximumDiscount);
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > applicableSubtotal) {
      discountAmount = applicableSubtotal;
    }

    return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Create a new promotional code (admin only)
   */
  static async createPromotionalCode(data: {
    code: string;
    name: string;
    description?: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    userUsageLimit?: number;
    startsAt: Date;
    expiresAt?: Date;
    applicableCategories?: string[];
    applicableProducts?: string[];
    excludedProducts?: string[];
    customerGroups?: string[];
  }) {
    try {
      const promotionalCode = await prisma.promotionalCode.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description,
          type: data.type,
          value: new Decimal(data.value),
          minimumAmount: data.minimumAmount ? new Decimal(data.minimumAmount) : null,
          maximumDiscount: data.maximumDiscount ? new Decimal(data.maximumDiscount) : null,
          usageLimit: data.usageLimit,
          userUsageLimit: data.userUsageLimit,
          startsAt: data.startsAt,
          expiresAt: data.expiresAt,
          applicableCategories: data.applicableCategories || [],
          applicableProducts: data.applicableProducts || [],
          excludedProducts: data.excludedProducts || [],
          customerGroups: data.customerGroups || []
        }
      });

      return promotionalCode;
    } catch (error) {
      console.error('Error creating promotional code:', error);
      throw error;
    }
  }

  /**
   * Get all promotional codes (admin only)
   */
  static async getAllPromotionalCodes() {
    try {
      const codes = await prisma.promotionalCode.findMany({
        include: {
          _count: {
            select: {
              usages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return codes;
    } catch (error) {
      console.error('Error fetching promotional codes:', error);
      throw error;
    }
  }

  /**
   * Update promotional code (admin only)
   */
  static async updatePromotionalCode(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isActive: boolean;
      value: number;
      minimumAmount: number;
      maximumDiscount: number;
      usageLimit: number;
      userUsageLimit: number;
      expiresAt: Date;
      applicableCategories: string[];
      applicableProducts: string[];
      excludedProducts: string[];
      customerGroups: string[];
    }>
  ) {
    try {
      const updateData: any = { ...data };
      
      // Convert number fields to Decimal
      if (data.value !== undefined) updateData.value = new Decimal(data.value);
      if (data.minimumAmount !== undefined) updateData.minimumAmount = new Decimal(data.minimumAmount);
      if (data.maximumDiscount !== undefined) updateData.maximumDiscount = new Decimal(data.maximumDiscount);

      const promotionalCode = await prisma.promotionalCode.update({
        where: { id },
        data: updateData
      });

      return promotionalCode;
    } catch (error) {
      console.error('Error updating promotional code:', error);
      throw error;
    }
  }

  /**
   * Delete promotional code (admin only)
   */
  static async deletePromotionalCode(id: string) {
    try {
      await prisma.promotionalCode.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting promotional code:', error);
      throw error;
    }
  }

  /**
   * Get promotional code usage statistics
   */
  static async getUsageStatistics(codeId: string) {
    try {
      const [totalUsage, recentUsage, totalDiscount] = await Promise.all([
        prisma.promotionalCodeUsage.count({
          where: { promotionalCodeId: codeId }
        }),
        prisma.promotionalCodeUsage.count({
          where: {
            promotionalCodeId: codeId,
            usedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),
        prisma.promotionalCodeUsage.aggregate({
          where: { promotionalCodeId: codeId },
          _sum: {
            discountAmount: true
          }
        })
      ]);

      return {
        totalUsage,
        recentUsage,
        totalDiscount: totalDiscount._sum.discountAmount || 0
      };
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw error;
    }
  }
}
