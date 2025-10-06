// Simple mock for promotional codes service
export const PromotionalCodesService = {
  validateCode: jest.fn(),
  createPromotionalCode: jest.fn(),
  getAllPromotionalCodes: jest.fn(),
  updatePromotionalCode: jest.fn(),
  deletePromotionalCode: jest.fn(),
  getUsageStatistics: jest.fn(),
  applyCodeToOrder: jest.fn(),
}
