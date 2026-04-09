import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  discount?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  points?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, price: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  total: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const items = get().items;
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.id !== productId) });
  },
  updateQuantity: (productId, quantity) => {
    set({
      items: get().items.map((i) =>
        i.id === productId ? { ...i, quantity: Math.max(0, quantity) } : i
      ).filter(i => i.quantity > 0),
    });
  },
  updatePrice: (productId, price) => {
    set({
      items: get().items.map((i) =>
        i.id === productId ? { ...i, price: Math.max(0, price) } : i
      ),
    });
  },
  updateDiscount: (productId, discount) => {
    set({
      items: get().items.map((i) =>
        i.id === productId ? { ...i, discount: Math.max(0, discount) } : i
      ),
    });
  },
  clearCart: () => set({ items: [] }),
  customer: null,
  setCustomer: (customer) => set({ customer }),
  get total() {
    return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  },
}));
