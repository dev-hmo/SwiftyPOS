import { create } from 'zustand';

interface EnterpriseStore {
  currentStoreId: string | null;
  setCurrentStore: (id: string | null) => void;
  stores: any[];
  setStores: (stores: any[]) => void;
}

export const useEnterpriseStore = create<EnterpriseStore>((set) => ({
  currentStoreId: null,
  setCurrentStore: (id) => set({ currentStoreId: id }),
  stores: [],
  setStores: (stores) => set({ stores }),
}));
