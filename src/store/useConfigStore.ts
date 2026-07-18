import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppStorage } from '../utils/storage';

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
}

interface ConfigState {
  categories: Category[];
  taxes: Tax[];
  incomeAccounts: Account[];
  expenseAccounts: Account[];

  addCategory: (name: string) => Category | null;
  addTax: (name: string, rate: number) => Tax | null;
  addIncomeAccount: (code: string, name: string) => Account | null;
  addExpenseAccount: (code: string, name: string) => Account | null;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      categories: [
        { id: '1', name: 'Coffee Beans', productCount: 15 },
        { id: '2', name: 'Equipment', productCount: 8 },
        { id: '3', name: 'Pastries', productCount: 12 },
      ],
      taxes: [
        { id: '1', name: 'Standard Sales Tax (8%)', rate: 8 },
        { id: '2', name: 'Tax Exempt', rate: 0 },
      ],
      incomeAccounts: [
        { id: '1', code: '4000', name: 'Sales Revenue' },
        { id: '2', code: '4100', name: 'Service Revenue' },
      ],
      expenseAccounts: [
        { id: '1', code: '5000', name: 'Cost of Goods Sold (COGS)' },
        { id: '2', code: '5100', name: 'Supplies Expense' },
      ],

      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const exists = get().categories.some(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return null;
        const newCat: Category = { id: crypto.randomUUID(), name: trimmed, productCount: 0 };
        set((state) => ({ categories: [...state.categories, newCat] }));
        return newCat;
      },

      addTax: (name, rate) => {
        const trimmed = name.trim();
        if (!trimmed || rate < 0 || rate > 100) return null;
        const exists = get().taxes.some(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) return null;
        const newTax: Tax = { id: crypto.randomUUID(), name: trimmed, rate };
        set((state) => ({ taxes: [...state.taxes, newTax] }));
        return newTax;
      },

      addIncomeAccount: (code, name) => {
        const trimmedCode = code.trim();
        const trimmedName = name.trim();
        if (!trimmedCode || !trimmedName) return null;
        const exists = get().incomeAccounts.some(
          (a) => a.code === trimmedCode || a.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) return null;
        const newAcc: Account = { id: crypto.randomUUID(), code: trimmedCode, name: trimmedName };
        set((state) => ({ incomeAccounts: [...state.incomeAccounts, newAcc] }));
        return newAcc;
      },

      addExpenseAccount: (code, name) => {
        const trimmedCode = code.trim();
        const trimmedName = name.trim();
        if (!trimmedCode || !trimmedName) return null;
        const exists = get().expenseAccounts.some(
          (a) => a.code === trimmedCode || a.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) return null;
        const newAcc: Account = { id: crypto.randomUUID(), code: trimmedCode, name: trimmedName };
        set((state) => ({ expenseAccounts: [...state.expenseAccounts, newAcc] }));
        return newAcc;
      },
    }),
    { name: 'config', storage: createAppStorage('config') }
  )
);
