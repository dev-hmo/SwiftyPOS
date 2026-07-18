import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateTax,
  calculateGrandTotal,
  calculateItemDiscount,
  calculateTotalDiscount,
} from '../calculations';

describe('calculateSubtotal', () => {
  it('sums price × quantity for all items', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(35);
  });

  it('applies per-unit flat discount', () => {
    const items = [{ price: 100, quantity: 1, discount: 10 }]; // $10 off
    expect(calculateSubtotal(items)).toBe(90);
  });

  it('clamps discount to price (effective price >= 0)', () => {
    const items = [{ price: 20, quantity: 2, discount: 50 }];
    expect(calculateSubtotal(items)).toBe(0);
  });

  it('returns 0 for empty cart', () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it('rounds fractional results', () => {
    const items = [{ price: 33.33, quantity: 3, discount: 0.01 }];
    expect(calculateSubtotal(items)).toBe(99.96);
  });
});

describe('calculateTax', () => {
  it('calculates standard tax', () => {
    expect(calculateTax(100, 8)).toBe(8);
  });

  it('returns 0 for zero rate', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it('returns 0 for non-positive subtotal', () => {
    expect(calculateTax(-100, 8)).toBe(0);
    expect(calculateTax(0, 8)).toBe(0);
  });

  it('returns 0 for negative rate', () => {
    expect(calculateTax(100, -5)).toBe(0);
  });

  it('handles fractional results with rounding', () => {
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

  it('clamps negative flat discount to 0', () => {
    expect(calculateGrandTotal(100, 8, -10)).toBe(108);
  });
});

describe('calculateItemDiscount', () => {
  it('returns the discount amount when valid', () => {
    expect(calculateItemDiscount(100, 15)).toBe(15);
  });

  it('caps discount at item price', () => {
    expect(calculateItemDiscount(50, 100)).toBe(50);
  });

  it('returns 0 for zero/negative inputs', () => {
    expect(calculateItemDiscount(0, 10)).toBe(0);
    expect(calculateItemDiscount(100, 0)).toBe(0);
    expect(calculateItemDiscount(-10, 10)).toBe(0);
  });
});

describe('calculateTotalDiscount', () => {
  it('sums per-unit discount × quantity across items', () => {
    const items = [
      { price: 100, quantity: 2, discount: 5 },
      { price: 50, quantity: 1, discount: 10 },
    ];
    expect(calculateTotalDiscount(items)).toBe(20);
  });

  it('returns 0 for items without discounts', () => {
    const items = [{ price: 100, quantity: 2 }];
    expect(calculateTotalDiscount(items)).toBe(0);
  });

  it('clamps per-unit discount to price', () => {
    const items = [{ price: 30, quantity: 3, discount: 50 }];
    expect(calculateTotalDiscount(items)).toBe(90);
  });
});
