import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { PlanTier } from '../types/tenant';
import type {
  UpgradeRequestWithTenant,
  SuperAdminTenant,
  SuperAdminAuditEntry,
  CustomerFilters,
} from '../types/superadmin';
import { useAuthStore } from './useAuthStore';

/* ─── Helpers ─── */

function mapDisplayStatus(
  sub: string,
  trialEnds: string | null,
): SuperAdminTenant['status'] {
  if (sub === 'suspended') return 'Suspended';
  if (sub === 'expired') return 'Expired';
  if (sub === 'trial') {
    if (trialEnds && new Date(trialEnds) < new Date()) return 'Expired';
    return 'Trial';
  }
  return 'Active';
}

function getRenewalDate(joinDate: Date): Date {
  const renewal = new Date(joinDate);
  const now = new Date();
  while (renewal <= now) {
    renewal.setMonth(renewal.getMonth() + 1);
  }
  return renewal;
}

function requireSuperAdmin(): string | null {
  const user = useAuthStore.getState().user;
  if (!user || user.role !== 'super_admin') return null;
  return user.id;
}

/* ─── Store ─── */

interface SaaSState {
  tenants: SuperAdminTenant[];
  selectedTenant: SuperAdminTenant | null;
  upgradeRequests: UpgradeRequestWithTenant[];
  auditLog: SuperAdminAuditEntry[];
  isLoading: boolean;
  error: string | null;

  fetchTenants: (filters?: CustomerFilters) => Promise<void>;
  fetchTenantDetails: (id: string) => Promise<void>;
  updateTenantInfo: (id: string, data: { name?: string; slug?: string }) => Promise<void>;
  suspendTenant: (id: string) => Promise<boolean>;
  reactivateTenant: (id: string) => Promise<void>;
  updateTenantPlan: (id: string, plan: PlanTier) => Promise<void>;
  clearSelectedTenant: () => void;

  fetchUpgradeRequests: () => Promise<void>;
  approveUpgradeRequest: (requestId: string) => Promise<boolean>;
  denyUpgradeRequest: (requestId: string, reason: string) => Promise<boolean>;

  fetchAuditLog: (tenantId?: string) => Promise<void>;
}

export const useSaaSStore = create<SaaSState>()((set, get) => ({
  tenants: [],
  selectedTenant: null,
  upgradeRequests: [],
  auditLog: [],
  isLoading: false,
  error: null,

  /* ── Tenant CRUD ── */

  fetchTenants: async (filters) => {
    if (!requireSuperAdmin()) {
      set({ error: 'Unauthorized: super admin access required.' });
      return;
    }

    set({ isLoading: true, error: null });

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, plan, subscription_status, trial_ends_at, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    const enriched = await Promise.all(
      (tenants ?? []).map(async (t) => {
        const { data: membership } = await supabase
          .from('user_tenants')
          .select('user_id')
          .eq('tenant_id', t.id)
          .eq('role', 'tenant_admin')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        let email = 'unknown';
        if (membership?.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(membership.user_id);
          email = userData?.user?.email ?? 'unknown';
        }

        const [{ count: storeCount }, { count: userCount }] = await Promise.all([
          supabase.from('stores').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id),
          supabase.from('user_tenants').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id).eq('is_active', true),
        ]);

        const displayStatus = mapDisplayStatus(t.subscription_status, t.trial_ends_at);

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          email,
          plan: t.plan as PlanTier,
          subscriptionStatus: t.subscription_status,
          status: displayStatus,
          joinDate: new Date(t.created_at).getTime(),
          lastActive: new Date(t.updated_at).getTime(),
          trialEndsAt: t.trial_ends_at,
          storeCount: storeCount ?? 0,
          userCount: userCount ?? 0,
          logoUrl: t.logo_url ?? null,
        } satisfies SuperAdminTenant;
      }),
    );

    let result = enriched;

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
        );
      }
      if (filters.plan !== 'all') {
        result = result.filter((t) => t.plan === filters.plan);
      }
      if (filters.status !== 'all') {
        result = result.filter((t) => t.status === filters.status);
      }
      if (filters.registrationDate !== 'all') {
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = Date.now() - daysMap[filters.registrationDate] * 86400000;
        result = result.filter((t) => t.joinDate >= cutoff);
      }
      if (filters.renewalDate !== 'all') {
        const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const upperBound = Date.now() + daysMap[filters.renewalDate] * 86400000;
        result = result.filter((t) => {
          const renewal = getRenewalDate(new Date(t.joinDate));
          return renewal.getTime() <= upperBound;
        });
      }
    }

    set({ tenants: result, isLoading: false });
  },

  fetchTenantDetails: async (id) => {
    if (!requireSuperAdmin()) return;
    set({ isLoading: true });

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !tenant) {
      set({ isLoading: false, error: error?.message ?? 'Tenant not found' });
      return;
    }

    const [{ count: storeCount }, { count: userCount }] = await Promise.all([
      supabase.from('stores').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
      supabase.from('user_tenants').select('*', { count: 'exact', head: true }).eq('tenant_id', id).eq('is_active', true),
    ]);

    let email = 'unknown';
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('user_id')
      .eq('tenant_id', id)
      .eq('role', 'tenant_admin')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (membership?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(membership.user_id);
      email = userData?.user?.email ?? 'unknown';
    }

    set({
      selectedTenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email,
        plan: tenant.plan as PlanTier,
        subscriptionStatus: tenant.subscription_status,
        status: mapDisplayStatus(tenant.subscription_status, tenant.trial_ends_at),
        joinDate: new Date(tenant.created_at).getTime(),
        lastActive: new Date(tenant.updated_at).getTime(),
        trialEndsAt: tenant.trial_ends_at,
        storeCount: storeCount ?? 0,
        userCount: userCount ?? 0,
        logoUrl: tenant.logo_url ?? null,
      },
      isLoading: false,
    });
  },

  updateTenantInfo: async (id, data) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return;

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = data.slug;

    const { error } = await supabase.from('tenants').update(updatePayload).eq('id', id);
    if (error) return;

    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'TENANT_INFO_UPDATED',
      entity_type: 'tenant',
      entity_id: id,
      metadata: data,
    });

    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, ...(data.name !== undefined && { name: data.name }), ...(data.slug !== undefined && { slug: data.slug }) } : t,
      ),
      selectedTenant: state.selectedTenant?.id === id
        ? { ...state.selectedTenant, ...(data.name !== undefined && { name: data.name }), ...(data.slug !== undefined && { slug: data.slug }) }
        : state.selectedTenant,
    }));
  },

  suspendTenant: async (id) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return false;

    const { error } = await supabase
      .from('tenants')
      .update({ subscription_status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return false;

    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'TENANT_SUSPENDED',
      entity_type: 'tenant',
      entity_id: id,
      metadata: { reason: 'Suspended by super admin', timestamp: new Date().toISOString() },
    });

    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, subscriptionStatus: 'suspended', status: 'Suspended' } : t,
      ),
      selectedTenant: state.selectedTenant?.id === id
        ? { ...state.selectedTenant, subscriptionStatus: 'suspended', status: 'Suspended' }
        : state.selectedTenant,
    }));

    return true;
  },

  reactivateTenant: async (id) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return;

    await supabase
      .from('tenants')
      .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'TENANT_REACTIVATED',
      entity_type: 'tenant',
      entity_id: id,
      metadata: { timestamp: new Date().toISOString() },
    });

    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, subscriptionStatus: 'active', status: 'Active' } : t,
      ),
      selectedTenant: state.selectedTenant?.id === id
        ? { ...state.selectedTenant, subscriptionStatus: 'active', status: 'Active' }
        : state.selectedTenant,
    }));
  },

  updateTenantPlan: async (id, plan) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return;

    const { error } = await supabase
      .from('tenants')
      .update({ plan, subscription_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'TENANT_PLAN_CHANGED',
        entity_type: 'tenant',
        entity_id: id,
        metadata: { new_plan: plan },
      });

      set((state) => ({
        tenants: state.tenants.map((t) =>
          t.id === id ? { ...t, plan, status: 'Active', subscriptionStatus: 'active' } : t,
        ),
        selectedTenant: state.selectedTenant?.id === id
          ? { ...state.selectedTenant, plan, status: 'Active', subscriptionStatus: 'active' }
          : state.selectedTenant,
      }));
    }
  },

  clearSelectedTenant: () => set({ selectedTenant: null }),

  /* ── Upgrade Requests ── */

  fetchUpgradeRequests: async () => {
    if (!requireSuperAdmin()) return;
    set({ isLoading: true });

    const { data: requests, error } = await supabase
      .from('upgrade_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    const enriched = await Promise.all(
      (requests ?? []).map(async (r) => {
        const [{ data: tenant }, { data: requester }] = await Promise.all([
          supabase.from('tenants').select('name').eq('id', r.tenant_id).maybeSingle(),
          supabase.auth.admin.getUserById(r.requested_by),
        ]);

        return {
          ...r,
          tenant_name: tenant?.name ?? 'Unknown',
          tenant_email: requester?.user?.email ?? 'unknown',
          requester_email: requester?.user?.email ?? 'unknown',
        } satisfies UpgradeRequestWithTenant;
      }),
    );

    set({ upgradeRequests: enriched, isLoading: false });
  },

  approveUpgradeRequest: async (requestId) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return false;

    const request = get().upgradeRequests.find((r) => r.id === requestId);
    if (!request) return false;

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) return false;

    const { error: planError } = await supabase
      .from('tenants')
      .update({
        plan: request.requested_plan,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.tenant_id);

    if (planError) return false;

    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'UPGRADE_APPROVED',
      entity_type: 'upgrade_request',
      entity_id: requestId,
      metadata: {
        tenant_id: request.tenant_id,
        from_plan: request.current_plan,
        to_plan: request.requested_plan,
        renewal_date: renewalDate.toISOString(),
      },
    });

    set((state) => ({
      upgradeRequests: state.upgradeRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() } : r,
      ),
      tenants: state.tenants.map((t) =>
        t.id === request.tenant_id ? { ...t, plan: request.requested_plan, status: 'Active', subscriptionStatus: 'active' } : t,
      ),
    }));

    return true;
  },

  denyUpgradeRequest: async (requestId, reason) => {
    const adminId = requireSuperAdmin();
    if (!adminId) return false;

    const request = get().upgradeRequests.find((r) => r.id === requestId);
    if (!request) return false;

    const { error } = await supabase
      .from('upgrade_requests')
      .update({
        status: 'denied',
        denial_reason: reason,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) return false;

    await supabase.from('audit_logs').insert({
      user_id: adminId,
      action: 'UPGRADE_DENIED',
      entity_type: 'upgrade_request',
      entity_id: requestId,
      metadata: {
        tenant_id: request.tenant_id,
        requested_plan: request.requested_plan,
        reason,
      },
    });

    set((state) => ({
      upgradeRequests: state.upgradeRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'denied', denial_reason: reason, reviewed_by: adminId, reviewed_at: new Date().toISOString() } : r,
      ),
    }));

    return true;
  },

  /* ── Audit Log ── */

  fetchAuditLog: async (tenantId) => {
    if (!requireSuperAdmin()) return;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error || !data) return;

    const enriched = await Promise.all(
      data.map(async (entry) => {
        let actor_email: string | undefined;
        if (entry.user_id) {
          const { data: userData } = await supabase.auth.admin.getUserById(entry.user_id);
          actor_email = userData?.user?.email ?? undefined;
        }
        return { ...entry, actor_email } satisfies SuperAdminAuditEntry;
      }),
    );

    set({ auditLog: enriched });
  },
}));

export type { SuperAdminTenant as SaaSTenant, UpgradeRequestWithTenant as UpgradeRequestRecord };
