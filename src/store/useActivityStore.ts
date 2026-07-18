import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTenantStorage } from '../utils/storage';

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SALE_COMPLETED'
  | 'REFUND'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'SETTINGS_CHANGED'
  | 'ORDER_HELD'
  | 'ORDER_RECALLED';

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  details: string;
  userId: string;
  timestamp: number;
}

interface ActivityState {
  entries: ActivityEntry[];
  logActivity: (action: ActivityAction, details: string, userId?: string) => void;
  clearLog: () => void;
}

const MAX_ENTRIES = 100;

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      entries: [],
      logActivity: (action, details, userId = 'system') =>
        set((state) => {
          const newEntry: ActivityEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            action,
            details,
            userId,
            timestamp: Date.now(),
          };
          const updated = [newEntry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries: updated };
        }),
      clearLog: () => set({ entries: [] }),
    }),
    { name: 'activity', storage: createTenantStorage('activity') }
  )
);
