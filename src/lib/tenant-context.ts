import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth';

/**
 * Immutable snapshot of the current user's auth context.
 * Extracted once per call to avoid redundant store reads.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}

/**
 * Returns the current user's auth context.
 * Throws if unauthenticated or lacks a tenant.
 */
export function getTenantContext(): TenantContext {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Authentication required.');
  if (!user.tenantId) throw new Error('No active tenant. Please log in.');
  return { tenantId: user.tenantId, userId: user.id, role: user.role };
}

/**
 * SECURITY GUARD: Rejects super_admin and requires a valid tenant.
 * Used by all tenant-scoped data access functions.
 */
export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (ctx.role === 'super_admin') {
    throw new Error('Super admins cannot access tenant-scoped resources.');
  }
  return ctx;
}

/**
 * SECURITY GUARD: Requires tenant_admin or manager role.
 * Used for write operations (create, update, delete).
 */
export function requireManagerContext(): TenantContext {
  const ctx = requireTenantContext();
  if (ctx.role !== 'tenant_admin' && ctx.role !== 'manager') {
    throw new Error('Insufficient permissions. Manager or admin role required.');
  }
  return ctx;
}

/**
 * SECURITY GUARD: Only tenant_admin can manage staff and workspace settings.
 */
export function requireOwnerContext(): TenantContext & { userId: string } {
  const ctx = requireTenantContext();
  if (ctx.role !== 'tenant_admin') {
    throw new Error('Only the workspace owner can perform this action.');
  }
  return ctx;
}

/**
 * SECURITY GUARD: Requires super_admin role.
 * Used by platform-level operations (tenant registry, billing).
 */
export function requireSuperAdminContext(): { userId: string; role: 'super_admin' } {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Authentication required.');
  if (user.role !== 'super_admin') {
    throw new Error('Super admin access required.');
  }
  return { userId: user.id, role: 'super_admin' };
}
