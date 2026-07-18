import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTenantStorage } from '../utils/storage';

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

const VALID_BUSINESS_TYPES: BusinessType[] = ['retail', 'fb', 'service'];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      businessName: 'My Enterprise',
      businessType: 'retail',
      currencySymbol: '$',
      taxRate: 0,
      receiptHeader: 'Welcome to our store!',
      receiptFooter: 'Thank you for your purchase!',
      updateSettings: (settings) =>
        set((state) => {
          const next = { ...state, ...settings };
          // Clamp taxRate to [0, 100]
          if (typeof next.taxRate === 'number') {
            next.taxRate = Math.max(0, Math.min(100, next.taxRate));
          }
          // Validate businessType
          if (next.businessType && !VALID_BUSINESS_TYPES.includes(next.businessType)) {
            next.businessType = state.businessType;
          }
          // Ensure currencySymbol is non-empty
          if (next.currencySymbol !== undefined && !next.currencySymbol) {
            next.currencySymbol = state.currencySymbol;
          }
          return next;
        }),
    }),
    { name: 'business-settings', storage: createTenantStorage('business-settings') }
  )
);
