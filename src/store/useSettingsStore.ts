import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type BusinessType = 'retail' | 'fb' | 'service';

interface SettingsStore {
  businessName: string;
  businessType: BusinessType;
  currencySymbol: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  updateSettings: (settings: Partial<SettingsStore>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      businessName: 'My Enterprise',
      businessType: 'retail',
      currencySymbol: '$',
      taxRate: 0,
      receiptHeader: 'Welcome to our store!',
      receiptFooter: 'Thank you for your purchase!',
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    { name: 'business-settings' }
  )
);
