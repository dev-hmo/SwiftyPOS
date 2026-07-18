export type PlanTier = 'free' | 'standard' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'suspended';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: PlanTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantStore {
  id: string;
  tenant_id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
}

export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  standard: 1,
  pro: 2,
  enterprise: 3,
};

export function canAccessPlan(current: PlanTier, required: PlanTier): boolean {
  return PLAN_HIERARCHY[current] >= PLAN_HIERARCHY[required];
}
