import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateTax,
  calculateGrandTotal,
  calculateItemDiscount,
} from '../calculations';

describe('calculateSubtotal', () => {
  it('sums price × quantity for all items', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(35);
  });

  it('applies per-item percentage discount', () => {
    const items = [{ price: 100, quantity: 1, discount: 10 }]; // 10% off
    expect(calculateSubtotal(items)).toBe(90);
  });

  it('returns 0 for empty cart', () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe('calculateTax', () => {
  it('calculates standard tax', () => {
    expect(calculateTax(100, 8)).toBe(8);
  });

  it('returns 0 for zero rate', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it('returns 0 for negative inputs', () => {
    expect(calculateTax(-100, 8)).toBe(0);
    expect(calculateTax(100, -5)).toBe(0);
  });

  it('handles fractional results with rounding', () => {
    // 33.33 * 8% = 2.6664 → should round to 2.67
    expect(calculateTax(33.33, 8)).toBe(2.67);
  });
});

describe('calculateGrandTotal', () => {
  it('sums subtotal + tax - discount', () => {
    expect(calculateGrandTotal(100, 8, 5)).toBe(103);
  });

  it('never returns negative', () => {
    expect(calculateGrandTotal(10, 0, 50)).toBe(0);
  });

  it('works without discount', () => {
    expect(calculateGrandTotal(100, 8)).toBe(108);
  });
});

describe('calculateItemDiscount', () => {
  it('calculates percentage discount', () => {
    expect(calculateItemDiscount(100, 15)).toBe(15);
  });

  it('caps at 100%', () => {
    expect(calculateItemDiscount(100, 150)).toBe(100);
  });

  it('returns 0 for zero/negative inputs', () => {
    expect(calculateItemDiscount(0, 10)).toBe(0);
    expect(calculateItemDiscount(100, 0)).toBe(0);
    expect(calculateItemDiscount(-10, 10)).toBe(0);
  });
});
