/**
 * Tenant-scoped query helpers for Supabase.
 *
 * These functions return pre-scoped query builders that enforce tenant_id
 * filtering. Use them instead of raw `supabase.from()` for tenant-scoped tables.
 *
 * Note: `.eq()` is only available on PostgrestFilterBuilder (after .select()),
 * not on PostgrestQueryBuilder (directly after .from()). These helpers
 * handle the correct chain automatically.
 */
import { supabase } from './supabase';
import {
  requireTenantContext,
  requireManagerContext,
  requireOwnerContext,
} from './tenant-context';

/**
 * Tables that MUST always be scoped by tenant_id.
 * Used for development-time warnings when a query bypasses tenant scoping.
 */
export const TENANT_SCOPED_TABLES = new Set([
  'products',
  'sales_transactions',
  'sales_items',
  'inventory_movements',
  'stores',
  'customers',
  'business_settings',
  'account_transactions',
  'product_categories',
  'product_variants',
  'product_stocks',
  'promotions',
  'user_tenants',
]);

/**
 * Returns a PostgrestFilterBuilder pre-filtered by tenant_id for SELECT queries.
 *
 * @example
 * const { data } = await tenantSelect('products');
 * // Equivalent to: supabase.from('products').select('*').eq('tenant_id', tenantId)
 *
 * // Chain additional filters:
 * const { data } = await tenantSelect('products').eq('is_active', true);
 */
export function tenantSelect(table: string, columns = '*') {
  const { tenantId } = requireTenantContext();
  return supabase.from(table).select(columns).eq('tenant_id', tenantId);
}

/**
 * Returns a PostgrestFilterBuilder for UPDATE queries, pre-scoped by tenant_id.
 * Tenant_id must be included in the update data separately.
 *
 * @example
 * await tenantUpdate('products').eq('id', productId).update({ name: 'New Name' });
 */
export function tenantUpdate(table: string) {
  const { tenantId } = requireTenantContext();
  return supabase.from(table).update({}).eq('tenant_id', tenantId);
}

/**
 * Returns a PostgrestFilterBuilder for DELETE queries, pre-scoped by tenant_id.
 *
 * @example
 * await tenantDelete('products').eq('id', productId);
 */
export function tenantDelete(table: string) {
  const { tenantId } = requireTenantContext();
  return supabase.from(table).delete().eq('tenant_id', tenantId);
}

/**
 * Validates that a row's tenant_id matches the current user's tenant.
 * Use as a post-query guard when fetching a single resource by ID.
 *
 * @returns true if the row belongs to the current tenant, false otherwise.
 */
export function validateRowOwnership(row: { tenant_id?: string | null } | null): boolean {
  if (!row) return false;
  if (row.tenant_id == null) return true;
  try {
    const ctx = requireTenantContext();
    return row.tenant_id === ctx.tenantId;
  } catch {
    return false;
  }
}

/**
 * Returns the current tenant_id string.
 * Convenience shorthand when you only need the ID.
 */
export function currentTenantId(): string {
  return requireTenantContext().tenantId;
}

/**
 * Dev-only warning when a table is queried without tenant scoping.
 */
export function assertTenantScopedTable(table: string): void {
  if (import.meta.env.DEV && !TENANT_SCOPED_TABLES.has(table)) {
    console.warn(
      `[BOLA] Table "${table}" is not in the tenant-scoped set. ` +
      `If this table has a tenant_id column, add it to TENANT_SCOPED_TABLES.`,
    );
  }
}

/**
 * Like tenantSelect but requires manager/admin role (for read access
 * that should be restricted from cashiers in some contexts).
 */
export function managerSelect(table: string, columns = '*') {
  const { tenantId } = requireManagerContext();
  return supabase.from(table).select(columns).eq('tenant_id', tenantId);
}

/**
 * Like tenantUpdate but requires owner (tenant_admin) role.
 */
export function ownerUpdate(table: string) {
  const { tenantId } = requireOwnerContext();
  return supabase.from(table).update({}).eq('tenant_id', tenantId);
}
