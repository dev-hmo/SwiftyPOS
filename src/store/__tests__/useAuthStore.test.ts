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
    });
    localStorage.clear();
  });

  describe('setUser', () => {
    it('sets the user object and derives role', () => {
      const mockUser = {
        id: 'u1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin' as const,
      };
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().role).toBe('admin');
    });

    it('accepts null to clear user', () => {
      useAuthStore.getState().setUser({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        role: 'admin',
      });
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().role).toBeNull();
    });
  });

  describe('setRole', () => {
    it('sets the user role', () => {
      useAuthStore.getState().setRole('admin');
      expect(useAuthStore.getState().role).toBe('admin');
    });

    it('accepts all valid roles', () => {
      const roles = ['admin', 'cashier', 'kitchen'] as const;
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
        role: 'admin',
      });
      useAuthStore.getState().setRole('admin');
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
});
