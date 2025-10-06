import { PromotionalCodesService } from './promotional-codes'

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    promotionalCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    promotionalCodeUsage: {
      count: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}))

const { prisma } = require('@/lib/database/prisma')

describe('PromotionalCodesService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateCode', () => {
    const mockCartItems = [
      {
        productId: 'prod1',
        categoryId: 'cat1',
        price: 100,
        quantity: 1,
      },
      {
        productId: 'prod2',
        categoryId: 'cat2',
        price: 50,
        quantity: 2,
      },
    ]

    it('should return invalid for non-existent code', async () => {
      prisma.promotionalCode.findUnique.mockResolvedValue(null)

      const result = await PromotionalCodesService.validateCode(
        'INVALID',
        'user1',
        mockCartItems,
        200
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid promotional code')
    })

    it('should return invalid for inactive code', async () => {
      const inactiveCode = {
        id: 'code1',
        code: 'INACTIVE',
        isActive: false,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
        type: 'PERCENTAGE',
        value: 10,
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: null,
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(inactiveCode)

      const result = await PromotionalCodesService.validateCode(
        'INACTIVE',
        'user1',
        mockCartItems,
        200
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This promotional code is no longer active')
    })

    it('should return invalid for expired code', async () => {
      const expiredCode = {
        id: 'code1',
        code: 'EXPIRED',
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-01-02'),
        type: 'PERCENTAGE',
        value: 10,
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: null,
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(expiredCode)

      const result = await PromotionalCodesService.validateCode(
        'EXPIRED',
        'user1',
        mockCartItems,
        200
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This promotional code has expired')
    })

    it('should validate percentage discount correctly', async () => {
      const validCode = {
        id: 'code1',
        code: 'SAVE10',
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        type: 'PERCENTAGE',
        value: 10,
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: null,
        maximumDiscount: null,
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(validCode)
      prisma.promotionalCodeUsage.count.mockResolvedValue(0)

      const result = await PromotionalCodesService.validateCode(
        'SAVE10',
        'user1',
        mockCartItems,
        200
      )

      expect(result.isValid).toBe(true)
      expect(result.discountAmount).toBe(20) // 10% of 200
      expect(result.code).toEqual(validCode)
    })

    it('should validate fixed amount discount correctly', async () => {
      const validCode = {
        id: 'code1',
        code: 'SAVE20',
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        type: 'FIXED_AMOUNT',
        value: 20,
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: null,
        maximumDiscount: null,
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(validCode)
      prisma.promotionalCodeUsage.count.mockResolvedValue(0)

      const result = await PromotionalCodesService.validateCode(
        'SAVE20',
        'user1',
        mockCartItems,
        200
      )

      expect(result.isValid).toBe(true)
      expect(result.discountAmount).toBe(20)
    })

    it('should respect minimum amount requirement', async () => {
      const validCode = {
        id: 'code1',
        code: 'SAVE10',
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        type: 'PERCENTAGE',
        value: 10,
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: 300, // Minimum 300 DA
        maximumDiscount: null,
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(validCode)

      const result = await PromotionalCodesService.validateCode(
        'SAVE10',
        'user1',
        mockCartItems,
        200 // Only 200 DA, below minimum
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Minimum order amount')
    })

    it('should respect maximum discount limit', async () => {
      const validCode = {
        id: 'code1',
        code: 'SAVE50',
        isActive: true,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2025-12-31'),
        type: 'PERCENTAGE',
        value: 50, // 50% discount
        usageLimit: null,
        usedCount: 0,
        userUsageLimit: null,
        minimumAmount: null,
        maximumDiscount: 50, // Max 50 DA discount
        applicableCategories: [],
        applicableProducts: [],
        excludedProducts: [],
      }

      prisma.promotionalCode.findUnique.mockResolvedValue(validCode)
      prisma.promotionalCodeUsage.count.mockResolvedValue(0)

      const result = await PromotionalCodesService.validateCode(
        'SAVE50',
        'user1',
        mockCartItems,
        200 // 50% would be 100 DA, but max is 50 DA
      )

      expect(result.isValid).toBe(true)
      expect(result.discountAmount).toBe(50) // Capped at maximum
    })
  })

  describe('createPromotionalCode', () => {
    it('should create promotional code with correct data', async () => {
      const codeData = {
        code: 'NEWCODE',
        name: 'New Code',
        description: 'Test code',
        type: 'PERCENTAGE' as const,
        value: 10,
        startsAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-12-31'),
      }

      const mockCreatedCode = { id: 'code1', ...codeData }
      prisma.promotionalCode.create.mockResolvedValue(mockCreatedCode)

      const result = await PromotionalCodesService.createPromotionalCode(codeData)

      expect(prisma.promotionalCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'NEWCODE',
          name: 'New Code',
          type: 'PERCENTAGE',
        }),
      })
      expect(result).toEqual(mockCreatedCode)
    })
  })
})
