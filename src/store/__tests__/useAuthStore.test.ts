import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../useAuthStore';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      role: null,
      isHydrated: false,
      memberships: [],
    });
    localStorage.clear();
  });

  describe('setUser', () => {
    it('sets the user object and derives role', () => {
      const mockUser = {
        id: 'u1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'tenant_admin' as const,
        tenantId: 't1',
        tenantSlug: 'test-workspace',
      };
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().role).toBe('tenant_admin');
    });

    it('accepts null to clear user', () => {
      useAuthStore.getState().setUser({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        role: 'tenant_admin',
        tenantId: 't1',
        tenantSlug: 'a',
      });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().role).toBeNull();
    });
  });

  describe('setRole', () => {
    it('sets the user role', () => {
      useAuthStore.getState().setRole('tenant_admin');
      expect(useAuthStore.getState().role).toBe('tenant_admin');
    });

    it('accepts all valid roles', () => {
      const roles = ['super_admin', 'tenant_admin', 'manager', 'cashier'] as const;
      roles.forEach((role) => {
        useAuthStore.getState().setRole(role);
        expect(useAuthStore.getState().role).toBe(role);
      });
    });
  });

  describe('logout', () => {
    it('clears user and role', async () => {
      useAuthStore.getState().setUser({
        id: 'u1',
        email: 'test@x.com',
        name: 'Test',
        role: 'tenant_admin',
        tenantId: 't1',
        tenantSlug: 'test',
      });
      useAuthStore.getState().setRole('tenant_admin');
      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.role).toBeNull();
    });

    it('clears user data from auth-storage', async () => {
      localStorage.setItem('auth-storage', JSON.stringify({ state: { user: { id: '1' }, role: 'admin' }, version: 0 }));
      await useAuthStore.getState().logout();
      const stored = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');
      expect(stored?.state?.user).toBeNull();
      expect(stored?.state?.role).toBeNull();
    });
  });

  describe('setHydrated', () => {
    it('marks the store as hydrated', () => {
      useAuthStore.getState().setHydrated();
      expect(useAuthStore.getState().isHydrated).toBe(true);
    });
  });

  describe('switchTenant', () => {
    it('updates user tenant context', async () => {
      useAuthStore.setState({
        user: {
          id: 'u1',
          email: 'test@x.com',
          name: 'Test',
          role: 'manager',
          tenantId: 't1',
          tenantSlug: 'workspace-1',
        },
        memberships: [
          {
            user_id: 'u1',
            tenant_id: 't1',
            role: 'manager',
            is_active: true,
            created_at: '2024-01-01',
          },
          {
            user_id: 'u1',
            tenant_id: 't2',
            role: 'tenant_admin',
            is_active: true,
            created_at: '2024-01-01',
          },
        ],
      });

      await useAuthStore.getState().switchTenant('t2');
      expect(useAuthStore.getState().user?.tenantId).toBe('t2');
      expect(useAuthStore.getState().user?.role).toBe('tenant_admin');
    });
  });
});
