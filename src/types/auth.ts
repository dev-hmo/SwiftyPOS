export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'cashier';

/** Role hierarchy level — higher = more privileges within a tenant. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  tenant_admin: 30,
  manager: 20,
  cashier: 10,
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  img?: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
}

export interface UserTenantMembership {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export const TENANT_ROLES: UserRole[] = ['tenant_admin', 'manager', 'cashier'];

export const ALL_ROLES: UserRole[] = ['super_admin', 'tenant_admin', 'manager', 'cashier'];

export function isTenantRole(role: UserRole): boolean {
  return TENANT_ROLES.includes(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'super_admin' || role === 'tenant_admin';
}

/** Super admins must never access tenant-scoped routes or data. */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'super_admin';
}

/** A user must have a valid tenant_id to access tenant-scoped resources. */
export function hasTenantContext(user: AuthUser | null): boolean {
  return user != null && isTenantRole(user.role) && user.tenantId != null;
}

/** Checks if the user's role level meets or exceeds the required level. */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/** Returns true only for tenant_admin — the first user who signs up. */
export function isTenantOwner(user: AuthUser | null): boolean {
  return user?.role === 'tenant_admin' && user.tenantId != null;
}
