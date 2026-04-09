import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanTier } from './useSubscriptionStore';

export interface Tenant {
  email: string;
  name: string;
  plan: PlanTier;
  joinDate: number; // timestamp
  lastActive: number; // timestamp
  status: 'Active' | 'Trial' | 'Expired';
}

interface SaaSState {
  tenants: Tenant[];
  registerTenant: (email: string, name: string, plan: PlanTier) => void;
  updateTenantActivity: (email: string) => void;
  updateTenantPlan: (email: string, plan: PlanTier) => void;
}

export const useSaaSStore = create<SaaSState>()(
  persist(
    (set) => ({
      tenants: [
        { 
          email: 'demo@restaurant.com', 
          name: 'Demo Restaurant', 
          plan: 'Standard', 
          joinDate: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
          lastActive: Date.now(),
          status: 'Trial'
        },
        { 
          email: 'cafe@swift.mm', 
          name: 'Swift Cafe', 
          plan: 'Pro', 
          joinDate: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
          lastActive: Date.now() - (2 * 60 * 60 * 1000),
          status: 'Active'
        }
      ],

      registerTenant: (email, name, plan) => set((state) => {
        if (state.tenants.find(t => t.email === email)) return state;
        return {
          tenants: [
            ...state.tenants,
            {
              email,
              name,
              plan,
              joinDate: Date.now(),
              lastActive: Date.now(),
              status: plan === 'Standard' ? 'Trial' : 'Active'
            }
          ]
        };
      }),

      updateTenantActivity: (email) => set((state) => ({
        tenants: state.tenants.map(t => t.email === email ? { ...t, lastActive: Date.now() } : t)
      })),

      updateTenantPlan: (email, plan) => set((state) => ({
        tenants: state.tenants.map(t => t.email === email ? { ...t, plan, status: 'Active' } : t)
      }))
    }),
    {
      name: 'swifty-saas-registry',
    }
  )
);
