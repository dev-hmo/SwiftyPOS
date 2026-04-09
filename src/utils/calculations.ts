/**
 * POS business logic calculation utilities.
 */

export interface CartLineItem {
  price: number;
  quantity: number;
  discount?: number; // percentage 0-100
}

/**
 * Calculate subtotal from line items (price × quantity).
 */
export function calculateSubtotal(items: CartLineItem[]): number {
  return items.reduce((sum, item) => {
    const effectivePrice = item.discount
      ? item.price * (1 - item.discount / 100)
      : item.price;
    return sum + effectivePrice * item.quantity;
  }, 0);
}

/**
 * Calculate tax amount from a subtotal and rate (percentage).
 */
export function calculateTax(subtotal: number, ratePercent: number): number {
  if (subtotal < 0 || ratePercent < 0) return 0;
  return Math.round(subtotal * (ratePercent / 100) * 100) / 100;
}

/**
 * Calculate the grand total after tax and optional flat discount.
 */
export function calculateGrandTotal(
  subtotal: number,
  tax: number,
  flatDiscount = 0
): number {
  const total = subtotal + tax - flatDiscount;
  return Math.max(0, Math.round(total * 100) / 100);
}

/**
 * Calculate per-item discount amount.
 */
export function calculateItemDiscount(
  price: number,
  discountPercent: number
): number {
  if (price <= 0 || discountPercent <= 0) return 0;
  const capped = Math.min(discountPercent, 100);
  return Math.round(price * (capped / 100) * 100) / 100;
}
