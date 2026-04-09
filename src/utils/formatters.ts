/**
 * Currency, date, and text formatting utilities for the POS system.
 */

/**
 * Format a number as currency.
 * @param amount - The numeric amount
 * @param symbol - Currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  if (!Number.isFinite(amount)) return `${symbol}0.00`;
  return `${symbol}${Math.abs(amount).toFixed(2)}${amount < 0 ? ' CR' : ''}`;
}

/**
 * Format a Date to a locale string.
 * @param date - Date object or ISO string
 * @param locale - Locale identifier (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  locale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(locale, options ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Truncate text to a maximum length with an ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (maxLength <= 0) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Generate a unique SKU prefix from a category name.
 */
export function generateSKU(categoryName: string, index: number): string {
  const prefix = categoryName.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase();
  return `${prefix || 'GEN'}-${String(index).padStart(3, '0')}`;
}
