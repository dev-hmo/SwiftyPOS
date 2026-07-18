/**
 * POS business logic calculation utilities.
 */

export interface CartLineItem {
  price: number;
  quantity: number;
  discount?: number; // flat per-unit discount amount (0 = no discount)
}

/** Round to 2 decimal places using banker's rounding to avoid floating-point drift. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate subtotal from line items after applying per-unit discounts.
 * For each item: (price - discount) × quantity.
 */
export function calculateSubtotal(items: CartLineItem[]): number {
  return round2(
    items.reduce((sum, item) => {
      const effectivePrice = Math.max(0, item.price - (item.discount ?? 0));
      return sum + effectivePrice * item.quantity;
    }, 0)
  );
}

/**
 * Calculate tax amount from a subtotal and rate (percentage 0-100).
 */
export function calculateTax(subtotal: number, ratePercent: number): number {
  if (subtotal <= 0 || ratePercent <= 0) return 0;
  return round2(subtotal * (ratePercent / 100));
}

/**
 * Calculate the grand total after tax and optional flat discount.
 */
export function calculateGrandTotal(
  subtotal: number,
  tax: number,
  flatDiscount = 0
): number {
  const total = subtotal + tax - Math.max(0, flatDiscount);
  return round2(Math.max(0, total));
}

/**
 * Calculate per-item discount amount (flat).
 * Clamps discount to item price so effective price never goes negative.
 */
export function calculateItemDiscount(
  price: number,
  discountAmount: number
): number {
  if (price <= 0 || discountAmount <= 0) return 0;
  return round2(Math.min(discountAmount, price));
}

/**
 * Calculate the total discount across all line items.
 */
export function calculateTotalDiscount(items: CartLineItem[]): number {
  return round2(
    items.reduce((sum, item) => {
      const perUnit = Math.min(item.discount ?? 0, item.price);
      return sum + perUnit * item.quantity;
    }, 0)
  );
}
