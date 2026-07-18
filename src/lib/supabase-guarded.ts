/**
 * Guarded Supabase access layer.
 *
 * This module re-exports the tenant-scoped query helpers from tenant-query.ts
 * as the canonical way to access Supabase tables. All tenant-scoped queries
 * MUST go through these functions to prevent BOLA (Broken Object Level Authorization).
 *
 * @example
 * import { tenantSelect, tenantDelete } from '../lib/supabase-guarded';
 *
 * // Read: pre-filtered by tenant_id
 * const { data } = await tenantSelect('products');
 *
 * // Delete: scoped to current tenant
 * await tenantDelete('products').eq('id', productId);
 */
export {
  tenantSelect,
  tenantUpdate,
  tenantDelete,
  managerSelect,
  ownerUpdate,
  validateRowOwnership,
  currentTenantId,
  assertTenantScopedTable,
  TENANT_SCOPED_TABLES,
} from './tenant-query';
