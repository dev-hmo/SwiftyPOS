import { create } from 'zustand';
import type { CartItem, Customer } from './useCartStore';

export interface HeldOrder {
  id: string;
  items: CartItem[];
  customer: Customer | null;
  note: string;
  timestamp: number;
}

interface HeldOrdersState {
  orders: HeldOrder[];
  holdOrder: (items: CartItem[], customer: Customer | null, note?: string) => string;
  recallOrder: (id: string) => HeldOrder | null;
  removeHeldOrder: (id: string) => void;
}

const MAX_HELD = 10;

export const useHeldOrdersStore = create<HeldOrdersState>((set, get) => ({
  orders: [],
  holdOrder: (items, customer, note = '') => {
    const id = `HOLD-${Date.now()}`;
    const order: HeldOrder = { id, items, customer, note, timestamp: Date.now() };
    set((state) => ({
      orders: [order, ...state.orders].slice(0, MAX_HELD),
    }));
    return id;
  },
  recallOrder: (id) => {
    const order = get().orders.find((o) => o.id === id) ?? null;
    if (order) {
      set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
    }
    return order;
  },
  removeHeldOrder: (id) =>
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
}));
