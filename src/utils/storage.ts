import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useAuthStore } from '../store/useAuthStore';

function getTenantId(): string | null {
  return useAuthStore.getState().user?.tenantId ?? null;
}

function tenantKey(base: string): string {
  const tid = getTenantId();
  return tid ? `${tid}__${base}` : base;
}

function tenantStorage(base: string): StateStorage {
  return {
    getItem: (name) => {
      const key = tenantKey(name || base);
      return localStorage.getItem(key);
    },
    setItem: (name, value) => {
      const key = tenantKey(name || base);
      localStorage.setItem(key, value);
    },
    removeItem: (name) => {
      const key = tenantKey(name || base);
      localStorage.removeItem(key);
    },
  };
}

export function createTenantStorage(base: string) {
  return createJSONStorage(() => tenantStorage(base));
}
