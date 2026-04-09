import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, role: null, isHydrated: false });
    localStorage.clear();
  });

  describe('setUser', () => {
    it('sets the user object', () => {
      const mockUser = { email: 'admin@example.com', id: '123' };
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('setRole', () => {
    it('sets the user role', () => {
      useAuthStore.getState().setRole('admin');
      expect(useAuthStore.getState().role).toBe('admin');
    });

    it('accepts all valid roles', () => {
      const roles: ('admin' | 'manager' | 'cashier')[] = ['admin', 'manager', 'cashier'];
      roles.forEach(role => {
        useAuthStore.getState().setRole(role);
        expect(useAuthStore.getState().role).toBe(role);
      });
    });
  });

  describe('logout', () => {
    it('clears user and role', () => {
      useAuthStore.getState().setUser({ email: 'test@x.com' });
      useAuthStore.getState().setRole('admin');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.role).toBeNull();
    });

    it('removes auth-storage from localStorage', () => {
      localStorage.setItem('auth-storage', JSON.stringify({ user: 'test' }));
      useAuthStore.getState().logout();
      expect(localStorage.getItem('auth-storage')).toBeNull();
    });
  });

  describe('setHydrated', () => {
    it('marks the store as hydrated', () => {
      useAuthStore.getState().setHydrated();
      expect(useAuthStore.getState().isHydrated).toBe(true);
    });
  });
});
