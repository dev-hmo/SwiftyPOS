import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { UserRole, AuthUser } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isHydrated: boolean;

  setUser: (user: AuthUser | null) => void;
  setRole: (role: UserRole | null) => void;
  setHydrated: () => void;

  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  inviteStaff: (
    email: string,
    role: UserRole,
  ) => Promise<{ error?: string }>;
}

async function buildUser(
  userId: string,
  email: string,
): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load user role:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    id: userId,
    email,
    name: email.split('@')[0],
    role: data.role as UserRole,
  };
}

function redirectForRole(role: UserRole) {
  if (role === 'cashier') return '/pos';
  if (role === 'kitchen') return '/kds';
  return '/admin';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isHydrated: false,

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
            error: 'No account found. Please contact your administrator.',
          };
        }

        set({ user, role: user.role });
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
        set({ user: null, role: null });
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

        set({ user, role: user.role, isHydrated: true });
      },

      inviteStaff: async (email, staffRole) => {
        const state = get();
        if (!state.user || state.user.role !== 'admin') {
          return { error: 'Only admins can invite staff.' };
        }

        const { data: inviteResult, error: rpcError } = await supabase.rpc(
          'invite_staff_to_tenant',
          {
            p_email: email,
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
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export { redirectForRole };
