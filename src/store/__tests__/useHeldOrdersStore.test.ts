import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useHeldOrdersStore } from '../useHeldOrdersStore';
import type { CartItem, Customer } from '../useCartStore';

const mockItems: CartItem[] = [
  { id: '1', sku: 'SKU1', name: 'Item 1', price: 10, quantity: 2 },
];
const mockCustomer: Customer = { id: 'c1', name: 'John Doe', email: 'john@example.com', points: 0 };

describe('useHeldOrdersStore', () => {
  beforeEach(() => {
    useHeldOrdersStore.setState({ orders: [] });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-22T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with an empty order list', () => {
    expect(useHeldOrdersStore.getState().orders).toEqual([]);
  });

  it('should hold an order and return a generated ID', () => {
    const id = useHeldOrdersStore.getState().holdOrder(mockItems, mockCustomer, 'Waiting for friend');
    const orders = useHeldOrdersStore.getState().orders;

    expect(id).toMatch(/^HOLD-\d+$/);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(id);
    expect(orders[0].items).toEqual(mockItems);
    expect(orders[0].customer).toEqual(mockCustomer);
    expect(orders[0].note).toBe('Waiting for friend');
    expect(orders[0].timestamp).toBe(Date.now());
  });

  it('should return null when holding an empty cart', () => {
    const id = useHeldOrdersStore.getState().holdOrder([], null);
    expect(id).toBeNull();
    expect(useHeldOrdersStore.getState().orders).toHaveLength(0);
  });

  it('should recall an order by ID and remove it from the held list', () => {
    const id = useHeldOrdersStore.getState().holdOrder(mockItems, mockCustomer);
    expect(id).not.toBeNull();
    expect(useHeldOrdersStore.getState().orders).toHaveLength(1);

    const recalledOrder = useHeldOrdersStore.getState().recallOrder(id!);
    expect(recalledOrder).not.toBeNull();
    expect(recalledOrder?.id).toBe(id);
    expect(useHeldOrdersStore.getState().orders).toHaveLength(0);
  });

  it('should return null when recalling a non-existent order', () => {
    const recalledOrder = useHeldOrdersStore.getState().recallOrder('INVALID-ID');
    expect(recalledOrder).toBeNull();
  });

  it('should remove a held order without returning it', () => {
    const id = useHeldOrdersStore.getState().holdOrder(mockItems, null);
    expect(useHeldOrdersStore.getState().orders).toHaveLength(1);

    useHeldOrdersStore.getState().removeHeldOrder(id!);
    expect(useHeldOrdersStore.getState().orders).toHaveLength(0);
  });

  it('should limit held orders to a maximum of 10 (FIFO)', () => {
    for (let i = 0; i < 15; i++) {
        useHeldOrdersStore.getState().holdOrder(mockItems, null, `Note ${i}`);
    }
    
    const orders = useHeldOrdersStore.getState().orders;
    expect(orders).toHaveLength(10);
    expect(orders[0].note).toBe('Note 14');
    expect(orders[9].note).toBe('Note 5');
  });
});
