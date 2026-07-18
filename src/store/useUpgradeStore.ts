import { create } from 'zustand';
import type { PlanTier } from '../types/tenant';

interface UpgradeStore {
  isOpen: boolean;
  targetTier: PlanTier | null;
  openCount: number;
  openModal: (targetTier?: PlanTier | null) => void;
  closeModal: () => void;
}

export const useUpgradeStore = create<UpgradeStore>((set) => ({
  isOpen: false,
  targetTier: null,
  openCount: 0,
  openModal: (targetTier = null) => set((s) => ({ isOpen: true, targetTier, openCount: s.openCount + 1 })),
  closeModal: () => set({ isOpen: false, targetTier: null }),
}));
