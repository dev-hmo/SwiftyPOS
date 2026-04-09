import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActivityStore } from '../useActivityStore';

describe('useActivityStore', () => {
  beforeEach(() => {
    // Reset state before tests
    useActivityStore.setState({ entries: [] });
    // Mock time for predictable timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with an empty log', () => {
    expect(useActivityStore.getState().entries).toEqual([]);
  });

  it('should log a new activity with system user default', () => {
    useActivityStore.getState().logActivity('LOGIN', 'User successfully logged in');
    const entries = useActivityStore.getState().entries;
    
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('LOGIN');
    expect(entries[0].details).toBe('User successfully logged in');
    expect(entries[0].userId).toBe('system');
    expect(entries[0].id).toBeDefined();
    expect(entries[0].timestamp).toBe(Date.now());
  });

  it('should log an activity with a specific user', () => {
    useActivityStore.getState().logActivity('SALE_COMPLETED', 'Order #1234', 'admin@example.com');
    const entries = useActivityStore.getState().entries;
    
    expect(entries[0].action).toBe('SALE_COMPLETED');
    expect(entries[0].userId).toBe('admin@example.com');
  });

  it('should prepend new logs ensuring the latest is first', () => {
    useActivityStore.getState().logActivity('LOGIN', 'First action');
    useActivityStore.getState().logActivity('LOGOUT', 'Second action');
    
    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('LOGOUT');
    expect(entries[1].action).toBe('LOGIN');
  });

  it('should implicitly limit log entries to exactly 100', () => {
    for (let i = 0; i < 110; i++) {
        useActivityStore.getState().logActivity('PRODUCT_ADDED', `Product ${i}`);
    }
    
    const entries = useActivityStore.getState().entries;
    expect(entries).toHaveLength(100);
    // The very first added (Product 0 - Product 9) should be dropped
    expect(entries[0].details).toBe('Product 109'); // newest
    expect(entries[99].details).toBe('Product 10'); // oldest surviving
  });

  it('should clear the entire activity log', () => {
    useActivityStore.getState().logActivity('LOGIN', 'Logged in');
    expect(useActivityStore.getState().entries).toHaveLength(1);
    
    useActivityStore.getState().clearLog();
    expect(useActivityStore.getState().entries).toHaveLength(0);
  });
});
