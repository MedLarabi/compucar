import { formatPrice } from './utils';

describe('formatPrice', () => {
  test('handles valid numbers', () => {
    expect(formatPrice(10)).toBe('10 DA');
    expect(formatPrice(10.5)).toBe('10 DA');
    expect(formatPrice(10.99)).toBe('11 DA');
  });

  test('handles string numbers', () => {
    expect(formatPrice('10')).toBe('10 DA');
    expect(formatPrice('10.5')).toBe('10 DA');
    expect(formatPrice('10.99')).toBe('11 DA');
  });

  test('handles null and undefined', () => {
    expect(formatPrice(null)).toBe('0 DA');
    expect(formatPrice(undefined)).toBe('0 DA');
  });

  test('handles invalid strings', () => {
    expect(formatPrice('invalid')).toBe('0 DA');
    expect(formatPrice('')).toBe('0 DA');
    expect(formatPrice('abc')).toBe('0 DA');
  });

  test('handles Prisma Decimal-like objects', () => {
    const decimalLike = {
      toNumber: () => 10.99
    };
    expect(formatPrice(decimalLike)).toBe('11 DA');
  });

  test('handles invalid Prisma Decimal-like objects', () => {
    const invalidDecimal = {
      toNumber: () => NaN
    };
    expect(formatPrice(invalidDecimal)).toBe('0 DA');
  });

  test('handles special number values', () => {
    expect(formatPrice(Infinity)).toBe('0 DA');
    expect(formatPrice(-Infinity)).toBe('0 DA');
    expect(formatPrice(NaN)).toBe('0 DA');
  });

  test('handles other data types', () => {
    expect(formatPrice({})).toBe('0 DA');
    expect(formatPrice([])).toBe('0 DA');
    expect(formatPrice(true)).toBe('0 DA'); // Non-number types default to 0
    expect(formatPrice(false)).toBe('0 DA');
  });
});