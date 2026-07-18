import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Feature } from '../types/rbac';
import type { PlanTier } from '../types/tenant';
import { canAccessPlan } from '../types/tenant';
import { createTenantStorage } from '../utils/storage';

export type { PlanTier, Feature };

interface SubscriptionStore {
  currentPlan: PlanTier;
  trialStartDate: number | null;
  isTrialUsed: boolean;
  setPlan: (plan: PlanTier) => void;
  startTrial: () => void;
  hasAccess: (feature: Feature) => boolean;
  getTrialDaysRemaining: () => number;
}

const FEATURE_REQUIRED_PLAN: Record<Feature, PlanTier> = {
  kds: 'standard',
  recipes: 'standard',
  advanced_reports: 'standard',
  custom_rbac: 'enterprise',
};

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      currentPlan: 'free',
      trialStartDate: null,
      isTrialUsed: false,

      setPlan: (plan) => set({ currentPlan: plan }),

      startTrial: () => {
        if (!get().isTrialUsed) {
          set({
            currentPlan: 'standard',
            trialStartDate: Date.now(),
            isTrialUsed: true,
          });
        }
      },

      getTrialDaysRemaining: () => {
        const { trialStartDate } = get();
        if (!trialStartDate) return 0;
        const elapsed = Date.now() - trialStartDate;
        const remaining = Math.max(
          0,
          14 * 24 * 60 * 60 * 1000 - elapsed,
        );
        return Math.ceil(remaining / (24 * 60 * 60 * 1000));
      },

      hasAccess: (feature) => {
        const { currentPlan, trialStartDate } = get();

        if (currentPlan === 'standard' && trialStartDate) {
          const elapsed = Date.now() - trialStartDate;
          const fourteenDays = 14 * 24 * 60 * 60 * 1000;
          if (elapsed > fourteenDays) {
            const required = FEATURE_REQUIRED_PLAN[feature];
            return canAccessPlan('free', required);
          }
        }

        const required = FEATURE_REQUIRED_PLAN[feature];
        return canAccessPlan(currentPlan, required);
      },
    }),
    {
      name: 'swifty-subscription',
      storage: createTenantStorage('swifty-subscription'),
    },
  ),
);
