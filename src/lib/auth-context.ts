import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

/**
 * Returns the current user's auth context.
 * Throws if unauthenticated.
 */
export function getAuthContext(): AuthContext {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Authentication required.');
  return { userId: user.id, role: user.role };
}

/**
 * SECURITY GUARD: Requires admin role.
 */
export function requireAdminContext(): AuthContext {
  const ctx = getAuthContext();
  if (ctx.role !== 'admin') {
    throw new Error('Admin access required.');
  }
  return ctx;
}

/**
 * SECURITY GUARD: Requires admin or cashier role.
 * Used for POS operations and sales processing.
 */
export function requireStaffContext(): AuthContext {
  const ctx = getAuthContext();
  if (ctx.role !== 'admin' && ctx.role !== 'cashier') {
    throw new Error('Staff access required.');
  }
  return ctx;
}

/**
 * SECURITY GUARD: Requires kitchen or admin role.
 * Used for KDS operations.
 */
export function requireKitchenContext(): AuthContext {
  const ctx = getAuthContext();
  if (ctx.role !== 'admin' && ctx.role !== 'kitchen') {
    throw new Error('Kitchen access required.');
  }
  return ctx;
}
