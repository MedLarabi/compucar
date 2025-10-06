import { ProductRecommendations } from './product-recommendations'

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/database/prisma')

describe('ProductRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPopularProducts', () => {
    it('should return popular products sorted by order count', async () => {
      const mockProducts = [
        {
          id: 'prod1',
          name: 'Popular Product 1',
          _count: { orderItems: 100 },
          reviews: [{ rating: 5 }, { rating: 4 }],
        },
        {
          id: 'prod2',
          name: 'Popular Product 2',
          _count: { orderItems: 80 },
          reviews: [{ rating: 4 }],
        },
      ]

      prisma.product.findMany.mockResolvedValue(mockProducts)

      const result = await ProductRecommendations.getPopularProducts(5)

      expect(result).toHaveLength(2)
      expect(result[0].productId).toBe('prod1')
      expect(result[0].score).toBe(100)
      expect(result[0].reason).toBe('Popular product')
      expect(result[1].productId).toBe('prod2')
      expect(result[1].score).toBe(99)
    })

    it('should handle empty products array', async () => {
      prisma.product.findMany.mockResolvedValue([])

      const result = await ProductRecommendations.getPopularProducts(5)

      expect(result).toHaveLength(0)
    })
  })

  describe('getPersonalizedRecommendations', () => {
    it('should return popular products for users with no purchase history', async () => {
      const mockPopularProducts = [
        {
          id: 'prod1',
          name: 'Popular Product',
          _count: { orderItems: 50 },
          reviews: [],
        },
      ]

      prisma.order.findMany.mockResolvedValue([]) // No orders
      prisma.product.findMany.mockResolvedValue(mockPopularProducts)

      const result = await ProductRecommendations.getPersonalizedRecommendations('user1', 5)

      expect(result).toHaveLength(1)
      expect(result[0].productId).toBe('prod1')
      expect(result[0].reason).toBe('Popular product')
    })

    it('should return category-based recommendations for users with purchase history', async () => {
      const mockOrders = [
        {
          orderItems: [
            {
              productId: 'purchased1',
              product: {
                categoryId: 'cat1',
                tags: [{ name: 'gaming' }, { name: 'rgb' }],
              },
            },
          ],
        },
      ]

      const mockSimilarProducts = [
        {
          id: 'similar1',
          name: 'Similar Product',
          categoryId: 'cat1',
          tags: [{ name: 'gaming' }],
          reviews: [{ rating: 5 }],
          _count: { orderItems: 10 },
          isFeatured: false,
        },
      ]

      prisma.order.findMany.mockResolvedValue(mockOrders)
      prisma.product.findMany.mockResolvedValue(mockSimilarProducts)

      const result = await ProductRecommendations.getPersonalizedRecommendations('user1', 5)

      expect(result).toHaveLength(1)
      expect(result[0].productId).toBe('similar1')
      expect(result[0].score).toBeGreaterThan(0)
    })
  })

  describe('getProductBasedRecommendations', () => {
    it('should return similar products based on category and tags', async () => {
      const mockProduct = {
        id: 'prod1',
        name: 'Source Product',
        categoryId: 'cat1',
        tags: [{ name: 'gaming' }, { name: 'rgb' }],
      }

      const mockSimilarProducts = [
        {
          id: 'similar1',
          name: 'Similar Product 1',
          categoryId: 'cat1', // Same category
          tags: [{ name: 'gaming' }], // Common tag
          reviews: [{ rating: 4 }],
          _count: { orderItems: 5 },
          price: 100,
        },
        {
          id: 'similar2',
          name: 'Similar Product 2',
          categoryId: 'cat2', // Different category
          tags: [{ name: 'rgb' }], // Common tag
          reviews: [],
          _count: { orderItems: 2 },
          price: 90,
        },
      ]

      prisma.product.findUnique.mockResolvedValue(mockProduct)
      prisma.product.findMany.mockResolvedValue(mockSimilarProducts)

      const result = await ProductRecommendations.getProductBasedRecommendations('prod1', 5)

      expect(result).toHaveLength(2)
      expect(result[0].score).toBeGreaterThan(result[1].score) // Same category should score higher
      expect(result[0].reason).toBe('Similar to Source Product')
    })

    it('should return popular products if source product not found', async () => {
      const mockPopularProducts = [
        {
          id: 'popular1',
          _count: { orderItems: 100 },
          reviews: [],
        },
      ]

      prisma.product.findUnique.mockResolvedValue(null) // Product not found
      prisma.product.findMany.mockResolvedValue(mockPopularProducts)

      const result = await ProductRecommendations.getProductBasedRecommendations('nonexistent', 5)

      expect(result).toHaveLength(1)
      expect(result[0].productId).toBe('popular1')
      expect(result[0].reason).toBe('Popular product')
    })
  })

  describe('trackUserBehavior', () => {
    it('should log user behavior', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await ProductRecommendations.trackUserBehavior('user1', 'prod1', 'view')

      expect(consoleSpy).toHaveBeenCalledWith(
        'User user1 performed view on product prod1'
      )

      consoleSpy.mockRestore()
    })
  })
})
