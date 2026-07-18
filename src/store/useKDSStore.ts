import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppStorage } from '../utils/storage';


export interface KDSItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface KDSOrder {
  id: string;
  receiptNumber: string;
  items: KDSItem[];
  status: 'NEW' | 'IN_PROGRESS' | 'READY';
  createdAt: number;
  cashier: string;
}

interface KDSState {
  orders: KDSOrder[];
  addOrder: (order: Omit<KDSOrder, 'status' | 'createdAt'>) => void;
  advanceStatus: (id: string) => void;
  clearAll: () => void;
}

export const useKDSStore = create<KDSState>()(
  persist(
    (set) => ({
      orders: [],
      
      addOrder: (orderData) => set((state) => ({
        orders: [
          ...state.orders,
          {
            ...orderData,
            status: 'NEW' as const,
            createdAt: Date.now()
          }
        ].slice(-24) // Keep last 24 orders to prevent bloat
      })),

      advanceStatus: (id) => set((state) => {
        const target = state.orders.find(o => o.id === id);
        if (!target) return state;

        if (target.status === 'READY') {
          return { orders: state.orders.filter(o => o.id !== id) };
        }

        return {
          orders: state.orders.map(o => {
            if (o.id !== id) return o;
            if (o.status === 'NEW') return { ...o, status: 'IN_PROGRESS' as const };
            if (o.status === 'IN_PROGRESS') return { ...o, status: 'READY' as const };
            return o;
          })
        };
      }),

      clearAll: () => set({ orders: [] })
    }),
    {
      name: 'kds',
      storage: createAppStorage('kds'),
    }
  )
);
