import { create } from 'zustand';

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
  
  addCategory: (name: string) => Category;
  addTax: (name: string, rate: number) => Tax;
  addIncomeAccount: (code: string, name: string) => Account;
  addExpenseAccount: (code: string, name: string) => Account;
}

export const useConfigStore = create<ConfigState>((set) => ({
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
    const newCat = { id: Date.now().toString(), name, productCount: 0 };
    set(state => ({ categories: [...state.categories, newCat] }));
    return newCat;
  },
  
  addTax: (name, rate) => {
    const newTax = { id: Date.now().toString(), name, rate };
    set(state => ({ taxes: [...state.taxes, newTax] }));
    return newTax;
  },

  addIncomeAccount: (code, name) => {
    const newAcc = { id: Date.now().toString(), code, name };
    set(state => ({ incomeAccounts: [...state.incomeAccounts, newAcc] }));
    return newAcc;
  },

  addExpenseAccount: (code, name) => {
    const newAcc = { id: Date.now().toString(), code, name };
    set(state => ({ expenseAccounts: [...state.expenseAccounts, newAcc] }));
    return newAcc;
  }
}));
