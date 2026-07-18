import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { UserRole, AuthUser, UserTenantMembership } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isHydrated: boolean;
  memberships: UserTenantMembership[];

  setUser: (user: AuthUser | null) => void;
  setRole: (role: UserRole | null) => void;
  setHydrated: () => void;

  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (
    email: string,
    password: string,
    businessName: string,
  ) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  inviteStaff: (
    email: string,
    role: 'manager' | 'cashier',
  ) => Promise<{ error?: string }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `ws-${Date.now()}`;
}

async function loadMemberships(
  userId: string,
): Promise<UserTenantMembership[]> {
  const { data, error } = await supabase
    .from('user_tenants')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) {
    console.error('Failed to load memberships:', error.message);
    return [];
  }
  return (data ?? []) as UserTenantMembership[];
}

async function checkSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('Failed to check super admin:', error.message);
    return false;
  }
  return data !== null;
}

async function fetchTenantInfo(
  tenantId: string,
): Promise<{ name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as { name: string; slug: string };
}

async function buildUser(
  userId: string,
  email: string,
): Promise<AuthUser | null> {
  const isSuper = await checkSuperAdmin(userId);
  if (isSuper) {
    return {
      id: userId,
      email,
      name: email.split('@')[0],
      role: 'super_admin',
      tenantId: null,
      tenantSlug: null,
    };
  }

  const memberships = await loadMemberships(userId);
  if (memberships.length === 0) return null;

  // Pick the most recently created active membership deterministically.
  const primary = memberships.reduce((latest, current) =>
    new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
  );
  const tenantInfo = await fetchTenantInfo(primary.tenant_id);

  return {
    id: userId,
    email,
    name: email.split('@')[0],
    role: primary.role as UserRole,
    tenantId: primary.tenant_id,
    tenantSlug: tenantInfo?.slug ?? null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isHydrated: false,
      memberships: [],

      setUser: (user) => set({ user, role: user?.role ?? null }),
      setRole: (role) => set({ role }),
      setHydrated: () => set({ isHydrated: true }),

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: error.message };

        const user = await buildUser(
          data.user.id,
          data.user.email ?? email,
        );
        if (!user) {
          return {
            error:
              'No tenant membership found. Please sign up to create a workspace.',
          };
        }

        const memberships = await loadMemberships(data.user.id);
        set({ user, role: user.role, memberships });
        return {};
      },

      signup: async (email, password, businessName) => {
        const trimmedPassword = password.trim();
        if (trimmedPassword.length < 6) {
          return { error: 'Password must be at least 6 characters.' };
        }
        if (!businessName.trim()) {
          return { error: 'Business name is required.' };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: trimmedPassword,
          options: { data: { business_name: businessName } },
        });
        if (error) return { error: error.message };

        const userId = data.user?.id;
        if (!userId) return { error: 'Signup failed: no user ID returned.' };

        const slug = slugify(businessName);

        const { data: tenantId, error: signupError } = await supabase.rpc(
          'create_tenant_for_signup',
          { p_name: businessName, p_slug: slug },
        );
        if (signupError || !tenantId) {
          return {
            error: `Failed to create workspace: ${signupError?.message ?? 'No tenant ID returned'}`,
          };
        }

        const tenantInfo = await fetchTenantInfo(tenantId);
        const user: AuthUser = {
          id: userId,
          email,
          name: email.split('@')[0],
          role: 'tenant_admin',
          tenantId,
          tenantSlug: tenantInfo?.slug ?? slug,
        };
        const memberships = await loadMemberships(userId);
        set({ user, role: 'tenant_admin', memberships });
        return {};
      },

      loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) return { error: error.message };
        return {};
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null, memberships: [] });
      },

      restoreSession: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          set({ isHydrated: true });
          return;
        }

        const user = await buildUser(
          session.user.id,
          session.user.email ?? '',
        );
        if (!user) {
          set({ isHydrated: true });
          return;
        }

        const memberships = await loadMemberships(session.user.id);
        set({ user, role: user.role, memberships, isHydrated: true });
      },

      switchTenant: async (tenantId: string) => {
        const state = get();
        if (!state.user) return;

        // SECURITY: Super admins cannot switch into tenants.
        if (state.user.role === 'super_admin') return;

        const membership = state.memberships.find(
          (m) => m.tenant_id === tenantId && m.is_active,
        );
        if (!membership) return;

        const tenantInfo = await fetchTenantInfo(tenantId);
        const updatedUser: AuthUser = {
          ...state.user,
          role: membership.role as UserRole,
          tenantId,
          tenantSlug: tenantInfo?.slug ?? null,
        };
        set({ user: updatedUser, role: membership.role as UserRole });
      },

      /**
       * Tenant Admin can invite staff by email. The user must already have
       * a Supabase auth account. Server-side RPC ensures only tenant_admin
       * can execute this.
       */
      inviteStaff: async (email, staffRole) => {
        const state = get();
        if (!state.user || state.user.role !== 'tenant_admin' || !state.user.tenantId) {
          return { error: 'Only the workspace owner can invite staff.' };
        }

        const { data: inviteResult, error: rpcError } = await supabase.rpc(
          'invite_staff_to_tenant',
          {
            p_email: email,
            p_tenant_id: state.user.tenantId,
            p_role: staffRole,
          },
        );

        if (rpcError) {
          return { error: rpcError.message };
        }
        if (inviteResult && typeof inviteResult === 'object' && 'error' in (inviteResult as Record<string, unknown>)) {
          return { error: (inviteResult as Record<string, string>).error };
        }

        return {};
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        memberships: state.memberships,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
