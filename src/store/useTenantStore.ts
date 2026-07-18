import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';
import { useCartStore } from './useCartStore';
import { useSalesStore } from './useSalesStore';
import { useActivityStore } from './useActivityStore';
import type { Tenant, TenantStore } from '../types/tenant';
import type { UserTenantMembership } from '../types/auth';

export interface TenantMembershipDetail {
  tenant_id: string;
  tenant_name: string;
  role: string;
}

interface TenantState {
  activeTenant: Tenant | null;
  tenantStores: TenantStore[];
  memberships: UserTenantMembership[];
  membershipDetails: TenantMembershipDetail[];
  isLoading: boolean;

  loadTenant: () => Promise<void>;
  loadTenantStores: () => Promise<void>;
  loadMemberships: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeTenant: null,
      tenantStores: [],
      memberships: [],
      membershipDetails: [],
      isLoading: false,

      loadTenant: async () => {
        const tenantId = useAuthStore.getState().user?.tenantId;
        if (!tenantId) {
          set({ activeTenant: null, isLoading: false });
          return;
        }
        set({ isLoading: true });
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();
        if (error || !data) {
          set({ activeTenant: null, isLoading: false });
          return;
        }
        set({ activeTenant: data as Tenant, isLoading: false });
      },

      loadTenantStores: async () => {
        const tenantId = useAuthStore.getState().user?.tenantId;
        if (!tenantId) {
          set({ tenantStores: [] });
          return;
        }
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name');
        if (error || !data) {
          set({ tenantStores: [] });
          return;
        }
        set({ tenantStores: data as TenantStore[] });
      },

      loadMemberships: async () => {
        const { user } = useAuthStore.getState();
        if (!user) {
          set({ memberships: [], membershipDetails: [] });
          return;
        }
        const { data, error } = await supabase
          .from('user_tenants')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        if (error || !data) {
          set({ memberships: [], membershipDetails: [] });
          return;
        }
        const memberships = data as UserTenantMembership[];
        const tenantIds = memberships.map((m) => m.tenant_id);
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id, name')
          .in('id', tenantIds);
        const tenantMap = new Map((tenants ?? []).map((t: { id: string; name: string }) => [t.id, t.name]));
        const membershipDetails: TenantMembershipDetail[] = memberships.map((m) => ({
          tenant_id: m.tenant_id,
          tenant_name: tenantMap.get(m.tenant_id) ?? m.tenant_id,
          role: m.role,
        }));
        set({ memberships, membershipDetails });
      },

      switchTenant: async (tenantId: string) => {
        await useAuthStore.getState().switchTenant(tenantId);
        set({ activeTenant: null, tenantStores: [] });
        useCartStore.setState({ items: [], customer: null });
        useSalesStore.setState({ sales: [] });
        useActivityStore.setState({ entries: [] });
        await useTenantStore.getState().loadTenant();
        await useTenantStore.getState().loadTenantStores();
      },
    }),
    {
      name: 'tenant-context',
      partialize: (state) => ({
        activeTenant: state.activeTenant,
        tenantStores: state.tenantStores,
      }),
    },
  ),
);
