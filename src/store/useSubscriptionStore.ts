import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PlanTier = 'Free' | 'Standard' | 'Pro' | 'Enterprise';
export type Feature = 'kds' | 'recipes' | 'advanced_reports' | 'custom_rbac';

interface SubscriptionStore {
  currentPlan: PlanTier;
  trialStartDate: number | null;
  isTrialUsed: boolean;
  setPlan: (plan: PlanTier) => void;
  startTrial: () => void;
  hasAccess: (feature: Feature) => boolean;
  getTrialDaysRemaining: () => number;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      currentPlan: 'Free',
      trialStartDate: null,
      isTrialUsed: false,
      
      setPlan: (plan) => set({ currentPlan: plan }),
      
      startTrial: () => {
        if (!get().isTrialUsed) {
          set({ 
            currentPlan: 'Standard', 
            trialStartDate: Date.now(),
            isTrialUsed: true 
          });
        }
      },

      getTrialDaysRemaining: () => {
        const { trialStartDate } = get();
        if (!trialStartDate) return 0;
        const elapsed = Date.now() - trialStartDate;
        const remaining = Math.max(0, (14 * 24 * 60 * 60 * 1000) - elapsed);
        return Math.ceil(remaining / (24 * 60 * 60 * 1000));
      },

      hasAccess: (feature) => {
        const { currentPlan, trialStartDate } = get();
        
        // Trial Over Logic
        if (currentPlan === 'Standard' && trialStartDate) {
          const elapsed = Date.now() - trialStartDate;
          const fourteenDays = 14 * 24 * 60 * 60 * 1000;
          if (elapsed > fourteenDays) {
            // Trial expired, treat as Free for feature gating
            if (feature === 'kds' || feature === 'recipes' || feature === 'advanced_reports' || feature === 'custom_rbac') return false;
            return true;
          }
        }

        switch (currentPlan) {
          case 'Enterprise':
            return true;
          case 'Pro':
            if (feature === 'custom_rbac') return false;
            return true;
          case 'Standard':
            // Standard (during trial or paid) gets KDS and Recipes? 
            // The user didn't specify features, I'll keep it same as Pro for now but without Enterprise features.
            if (feature === 'custom_rbac') return false;
            return true;
          case 'Free':
          default:
            if (feature === 'kds') return false;
            if (feature === 'recipes') return false;
            if (feature === 'advanced_reports') return false;
            if (feature === 'custom_rbac') return false;
            return true;
        }
      }
    }),
    {
      name: 'swifty-subscription-storage',
    }
  )
);
