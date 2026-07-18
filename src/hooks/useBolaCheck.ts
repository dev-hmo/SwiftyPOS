import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook version of BolaGuard for use in non-JSX contexts.
 * Returns true if the resource belongs to the current tenant.
 *
 * @example
 * const product = await fetchProductById(id);
 * const isOwned = useBolaCheck(product);
 * if (!isOwned) return <AccessDenied />;
 */
export function useBolaCheck(resource: { tenant_id?: string | null } | null | undefined): boolean {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => {
    if (!resource) return false;
    if (resource.tenant_id == null) return true;
    if (!user || user.role === 'super_admin' || !user.tenantId) return false;
    return resource.tenant_id === user.tenantId;
  }, [resource, user]);
}
