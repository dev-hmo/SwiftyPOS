import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { isSuperAdmin, isTenantRole } from '../types/auth';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Tenant-scoped route guard.
 *
 * SECURITY RULES:
 * 1. Super admins are NEVER allowed on tenant routes — they redirect to /super-admin.
 * 2. Only tenant roles (tenant_admin, manager, cashier) may access.
 * 3. The user must have a valid tenantId bound to their session.
 */
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // SECURITY: Super admins must only access /super-admin routes.
  if (isSuperAdmin(user)) {
    return <Navigate to="/super-admin" replace />;
  }

  // SECURITY: Only tenant roles are allowed on these routes.
  if (!isTenantRole(role)) {
    return <Navigate to="/login" replace />;
  }

  // SECURITY: Must have an active tenant context.
  if (!user.tenantId) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the most permissive route the user's role can access.
    if (role === 'tenant_admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}
