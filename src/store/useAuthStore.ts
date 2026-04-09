import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSaaSStore } from './useSaaSStore';
import { useSubscriptionStore } from './useSubscriptionStore';

interface AuthState {
  user: any | null;
  role: 'admin' | 'manager' | 'cashier' | null;
  isHydrated: boolean;
  setUser: (user: any) => void;
  setRole: (role: 'admin' | 'manager' | 'cashier' | null) => void;
  setHydrated: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isHydrated: false,
      setUser: (user: any) => set({ user }),
      setRole: (role: 'admin' | 'manager' | 'cashier' | null) => set({ role }),
      setHydrated: () => set({ isHydrated: true }),
      
      loginWithGoogle: () => {
        // Mock Google Auth Success
        const mockUser = {
          email: 'test' + Math.floor(Math.random() * 1000) + '@gmail.com',
          name: 'Google User',
          img: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=100&auto=format&fit=crop'
        };
        
        set({ user: mockUser, role: 'admin' });
        
        // Register in SaaS Store if brand new
        useSaaSStore.getState().registerTenant(mockUser.email, mockUser.name, 'Standard');
        
        // Auto-start trial in Subscription Store
        useSubscriptionStore.getState().startTrial();
      },

      logout: () => {
        set({ user: null, role: null });
        localStorage.removeItem('auth-storage'); // Explicit clear
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state: any) => {
        state?.setHydrated();
      },
    }
  )
);
