import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppStorage } from '../utils/storage';

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
  cashierId?: string;
  customer: string | null;
  status: 'Completed' | 'Refunded' | 'Voided';
  createdAt: string;
}

interface SalesState {
  sales: SaleRecord[];
  receiptSeq: number;
  addSale: (sale: Omit<SaleRecord, 'id' | 'receiptNumber' | 'createdAt' | 'status'>) => SaleRecord;
  refundSale: (id: string) => void;
  getSaleById: (id: string) => SaleRecord | undefined;
}

function generateReceiptNumber(seq: number): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const padded = seq.toString().padStart(4, '0');
  return `SML-${yy}${mm}-${padded}`;
}

function round2(n: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      receiptSeq: 0,

      addSale: (saleData) => {
        const prevSeq = get().receiptSeq;
        const nextSeq = (prevSeq + 1) % 10000;
        const newSale: SaleRecord = {
          ...saleData,
          id: `TRX-${crypto.randomUUID()}`,
          receiptNumber: generateReceiptNumber(nextSeq),
          status: 'Completed',
          subtotal: round2(saleData.subtotal),
          tax: round2(saleData.tax),
          discount: round2(saleData.discount),
          total: round2(saleData.total),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sales: [newSale, ...state.sales],
          receiptSeq: nextSeq,
        }));
        return newSale;
      },

      refundSale: (id) => {
        set((state) => ({
          sales: state.sales.map((s) =>
            s.id === id ? { ...s, status: 'Refunded' as const } : s
          ),
        }));
      },

      getSaleById: (id) => {
        return get().sales.find((s) => s.id === id);
      },
    }),
    { name: 'sales', storage: createAppStorage('sales') }
  )
);
