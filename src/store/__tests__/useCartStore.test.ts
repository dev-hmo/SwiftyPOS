import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';

const mockProduct = {
  id: 'prod-1',
  name: 'Arabica Beans 1kg',
  price: 24.50,
  sku: 'COF-001',
};

const mockProduct2 = {
  id: 'prod-2',
  name: 'Green Tea Box',
  price: 18.00,
  sku: 'TEA-002',
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], customer: null });
  });

  describe('addItem', () => {
    it('adds a new product to the cart', () => {
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('prod-1');
      expect(items[0].quantity).toBe(1);
    });

    it('increments quantity for an existing product', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct);
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('handles multiple different products', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      expect(useCartStore.getState().items).toHaveLength(2);
    });

    it('rejects products without id or name', () => {
      useCartStore.getState().addItem({ id: '', name: 'Test', price: 10, quantity: 1, sku: 'X' });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('clamps negative prices to 0', () => {
      useCartStore.getState().addItem({ ...mockProduct, price: -5 });
      expect(useCartStore.getState().items[0].price).toBe(0);
    });
  });

  describe('removeItem', () => {
    it('removes a product by ID', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().removeItem('prod-1');
      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('prod-2');
    });

    it('does nothing for non-existent ID', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().removeItem('non-existent');
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates the quantity of an item', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 5);
      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 0);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('clamps to 0 for negative values and removes', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', -3);
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('floors fractional quantities', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateQuantity('prod-1', 3.7);
      expect(useCartStore.getState().items[0].quantity).toBe(3);
    });
  });

  describe('updatePrice', () => {
    it('updates price of an item', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updatePrice('prod-1', 30);
      expect(useCartStore.getState().items[0].price).toBe(30);
    });

    it('clamps to 0 for negative price', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updatePrice('prod-1', -10);
      expect(useCartStore.getState().items[0].price).toBe(0);
    });

    it('clamps discount when price drops below it', () => {
      useCartStore.getState().addItem({ ...mockProduct, discount: 10 });
      useCartStore.getState().updatePrice('prod-1', 5);
      expect(useCartStore.getState().items[0].discount).toBe(5);
    });
  });

  describe('updateDiscount', () => {
    it('sets a discount on an item', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateDiscount('prod-1', 5);
      expect(useCartStore.getState().items[0].discount).toBe(5);
    });

    it('clamps to 0 for negative discount', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateDiscount('prod-1', -5);
      expect(useCartStore.getState().items[0].discount).toBe(0);
    });

    it('caps discount at item price', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().updateDiscount('prod-1', 100);
      expect(useCartStore.getState().items[0].discount).toBe(24.50);
    });
  });

  describe('clearCart', () => {
    it('empties all items', () => {
      useCartStore.getState().addItem(mockProduct);
      useCartStore.getState().addItem(mockProduct2);
      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('getSubtotal', () => {
    it('calculates subtotal with discounts', () => {
      useCartStore.getState().addItem({ ...mockProduct, quantity: 1 });
      useCartStore.getState().updateDiscount('prod-1', 4.50);
      expect(useCartStore.getState().getSubtotal()).toBe(20);
    });
  });

  describe('customer', () => {
    it('sets and clears a customer', () => {
      const customer = { id: 'c1', name: 'John', email: 'j@x.com' };
      useCartStore.getState().setCustomer(customer);
      expect(useCartStore.getState().customer?.name).toBe('John');

      useCartStore.getState().setCustomer(null);
      expect(useCartStore.getState().customer).toBeNull();
    });
  });
});
