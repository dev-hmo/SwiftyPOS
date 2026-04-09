import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SaleRecord {
  id: string;
  receiptNumber: string;
  items: { name: string; sku: string; quantity: number; price: number; discount?: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashier: string;
  customer: string | null;
  status: 'Completed' | 'Refunded' | 'Voided';
  createdAt: string;
}

interface SalesState {
  sales: SaleRecord[];
  addSale: (sale: Omit<SaleRecord, 'id' | 'receiptNumber' | 'createdAt' | 'status'>) => SaleRecord;
  refundSale: (id: string) => void;
  getSaleById: (id: string) => SaleRecord | undefined;
  todayRevenue: () => number;
  todayOrderCount: () => number;
}

function generateReceiptNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SML-${yy}${mm}-${seq}`;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],

      addSale: (saleData) => {
        const newSale: SaleRecord = {
          ...saleData,
          id: `TRX-${Date.now()}`,
          receiptNumber: generateReceiptNumber(),
          status: 'Completed',
          createdAt: new Date().toISOString(),
        };
        set(state => ({ sales: [newSale, ...state.sales] }));
        return newSale;
      },

      refundSale: (id) => {
        set(state => ({
          sales: state.sales.map(s =>
            s.id === id ? { ...s, status: 'Refunded' as const } : s
          ),
        }));
      },

      getSaleById: (id) => {
        return get().sales.find(s => s.id === id);
      },

      todayRevenue: () => {
        const today = new Date().toDateString();
        return get().sales
          .filter(s => new Date(s.createdAt).toDateString() === today && s.status === 'Completed')
          .reduce((sum, s) => sum + s.total, 0);
      },

      todayOrderCount: () => {
        const today = new Date().toDateString();
        return get().sales
          .filter(s => new Date(s.createdAt).toDateString() === today)
          .length;
      },
    }),
    { name: 'sales-storage' }
  )
);
