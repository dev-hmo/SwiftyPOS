import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null;
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'cashier') return <Navigate to="/pos" replace />;
    return <Navigate to="/kds" replace />;
  }

  return <Outlet />;
}
