import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppStorage } from '../utils/storage';

export interface EnterpriseStoreItem {
  id: string;
  name: string;
  location?: string;
  is_active: boolean;
}

interface EnterpriseState {
  currentStoreId: string | null;
  setCurrentStore: (id: string | null) => void;
  stores: EnterpriseStoreItem[];
  setStores: (stores: EnterpriseStoreItem[]) => void;
}

export const useEnterpriseStore = create<EnterpriseState>()(
  persist(
    (set) => ({
      currentStoreId: null,
      setCurrentStore: (id) => set({ currentStoreId: id }),
      stores: [],
      setStores: (stores) => set({ stores }),
    }),
    { name: 'enterprise', storage: createAppStorage('enterprise') }
  )
);
