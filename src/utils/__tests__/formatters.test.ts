import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, truncateText, generateSKU } from '../formatters';

describe('formatCurrency', () => {
  it('formats a standard amount', () => {
    expect(formatCurrency(24.5)).toBe('$24.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative amounts with CR suffix', () => {
    expect(formatCurrency(-10)).toBe('$10.00 CR');
  });

  it('uses custom currency symbol', () => {
    expect(formatCurrency(100, '€')).toBe('€100.00');
  });

  it('handles NaN / Infinity', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
    expect(formatCurrency(Infinity)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('formats a Date object', () => {
    const result = formatDate(new Date('2025-01-15'));
    expect(result).toContain('2025');
  });

  it('formats an ISO string', () => {
    const result = formatDate('2025-06-01');
    expect(result).toContain('2025');
  });

  it('returns error string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });
});

describe('truncateText', () => {
  it('returns full text when under max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello…');
  });

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('handles zero maxLength', () => {
    expect(truncateText('Hello', 0)).toBe('');
  });
});

describe('generateSKU', () => {
  it('generates a SKU from category name', () => {
    expect(generateSKU('Coffee', 1)).toBe('COF-001');
  });

  it('pads index to 3 digits', () => {
    expect(generateSKU('Tea', 42)).toBe('TEA-042');
  });

  it('falls back to GEN for empty/special names', () => {
    expect(generateSKU('', 1)).toBe('GEN-001');
    expect(generateSKU('123', 1)).toBe('GEN-001');
  });
});
