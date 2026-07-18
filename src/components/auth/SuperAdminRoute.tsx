import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Route guard for the Super Admin area.
 *
 * SECURITY RULES:
 * 1. Only users with the 'super_admin' role may access.
 * 2. If the user somehow has both super_admin and tenant roles,
 *    the super_admin path always takes precedence — but they
 *    must NOT carry a tenantId into this area.
 */
export default function SuperAdminRoute() {
  const { user, role, isHydrated } = useAuthStore();

  if (!isHydrated) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'super_admin') return <Navigate to="/admin" replace />;

  return <Outlet />;
}
