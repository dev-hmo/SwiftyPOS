import { createJSONStorage, type StateStorage } from 'zustand/middleware';

function plainStorage(base: string): StateStorage {
  return {
    getItem: (name) => localStorage.getItem(name || base),
    setItem: (name, value) => localStorage.setItem(name || base, value),
    removeItem: (name) => localStorage.removeItem(name || base),
  };
}

export function createAppStorage(base: string) {
  return createJSONStorage(() => plainStorage(base));
}
