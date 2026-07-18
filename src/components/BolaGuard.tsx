import { useMemo } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuthStore } from '../store/useAuthStore';

interface BolaGuardProps {
  /** The resource row fetched from the database. Must have a tenant_id field. */
  resource: { tenant_id?: string | null } | null | undefined;
  /** Content to render if the resource belongs to the current tenant. */
  children: React.ReactNode;
  /** Fallback to render if BOLA check fails (default: access denied UI). */
  fallback?: React.ReactNode;
  /** Optional callback when access is denied. */
  onAccessDenied?: () => void;
}

/**
 * Client-side BOLA guard for resource-by-ID patterns.
 *
 * Wraps any component that displays a single resource fetched by ID.
 * If the resource's tenant_id doesn't match the current user's tenant,
 * renders an access-denied UI instead of the children.
 *
 * Usage:
 * ```tsx
 * const product = await fetchProductById(id);
 * return (
 *   <BolaGuard resource={product}>
 *     <ProductDetail product={product} />
 *   </BolaGuard>
 * );
 * ```
 *
 * NOTE: This is a defense-in-depth measure. The primary protection is
 * server-side RLS + the `tenantQuery()` wrapper that appends tenant_id
 * to all queries. This component catches cases where a query was
 * accidentally constructed without tenant scoping.
 */
export function BolaGuard({ resource, children, fallback, onAccessDenied }: BolaGuardProps) {
  const user = useAuthStore((s) => s.user);

  const isAuthorized = useMemo(() => {
    if (!resource) return false;
    // Global resource (no tenant_id field) — allow
    if (resource.tenant_id == null) return true;
    // Super admins should never reach here (blocked by route guards)
    if (!user || user.role === 'super_admin' || !user.tenantId) return false;
    return resource.tenant_id === user.tenantId;
  }, [resource, user]);

  if (isAuthorized) return <>{children}</>;

  if (onAccessDenied) {
    onAccessDenied();
  }

  if (fallback) return <>{fallback}</>;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 2,
        p: 4,
      }}
    >
      <LockOutlined sx={{ fontSize: 48, color: 'error.main' }} />
      <Typography variant="h5" fontWeight={600}>
        Access Denied
      </Typography>
      <Alert severity="error" sx={{ maxWidth: 400 }}>
        You do not have permission to view this resource. It may belong to
        a different workspace.
      </Alert>
      <Button variant="outlined" onClick={() => window.history.back()}>
        Go Back
      </Button>
    </Box>
  );
}
