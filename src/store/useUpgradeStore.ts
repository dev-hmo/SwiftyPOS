import { create } from 'zustand';
import { type PlanTier } from './useSubscriptionStore';

interface UpgradeStore {
  isOpen: boolean;
  targetTier: PlanTier | null;
  openModal: (targetTier?: PlanTier | null) => void;
  closeModal: () => void;
}

export const useUpgradeStore = create<UpgradeStore>((set) => ({
  isOpen: false,
  targetTier: null,
  openModal: (targetTier = null) => set({ isOpen: true, targetTier }),
  closeModal: () => set({ isOpen: false, targetTier: null }),
}));
