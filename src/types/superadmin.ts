import type { PlanTier } from './tenant';

export type UpgradeRequestStatus = 'pending' | 'approved' | 'denied';

export interface UpgradeRequest {
  id: string;
  tenant_id: string;
  requested_by: string;
  current_plan: PlanTier;
  requested_plan: PlanTier;
  status: UpgradeRequestStatus;
  payment_method: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  amount: number | null;
  denial_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpgradeRequestWithTenant extends UpgradeRequest {
  tenant_name: string;
  tenant_email: string;
  requester_email: string;
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: PlanTier;
  subscriptionStatus: string;
  status: 'Active' | 'Trial' | 'Expired' | 'Suspended';
  joinDate: number;
  lastActive: number;
  trialEndsAt: string | null;
  storeCount: number;
  userCount: number;
  logoUrl: string | null;
}

export interface SuperAdminAuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  tenant_id: string | null;
  created_at: string;
  actor_email?: string;
}

export type CustomerFilterPlan = PlanTier | 'all';
export type CustomerFilterStatus = 'Active' | 'Trial' | 'Expired' | 'Suspended' | 'all';
export type CustomerFilterDateRange = 'all' | '7d' | '30d' | '90d' | '1y';

export interface CustomerFilters {
  search: string;
  plan: CustomerFilterPlan;
  status: CustomerFilterStatus;
  registrationDate: CustomerFilterDateRange;
  renewalDate: CustomerFilterDateRange;
}
