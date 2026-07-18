export type UserRole = 'admin' | 'cashier' | 'kitchen';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 30,
  cashier: 10,
  kitchen: 10,
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  img?: string;
  role: UserRole;
}

export const ALL_ROLES: UserRole[] = ['admin', 'cashier', 'kitchen'];

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}
