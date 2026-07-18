/**
 * Single-tenant query helpers for Supabase.
 *
 * These functions enforce authentication for all data access.
 * In a single-tenant system, there is no tenant_id scoping needed.
 */
import { supabase } from './supabase';
import { requireAdminContext, requireStaffContext } from './auth-context';

/**
 * Returns a PostgrestFilterBuilder for SELECT queries.
 * Requires staff-level authentication.
 */
export function staffSelect(table: string, columns = '*') {
  requireStaffContext();
  return supabase.from(table).select(columns);
}

/**
 * Returns a PostgrestFilterBuilder for UPDATE queries.
 * Requires admin role.
 */
export function adminUpdate(table: string) {
  requireAdminContext();
  return supabase.from(table).update({});
}

/**
 * Returns a PostgrestFilterBuilder for DELETE queries.
 * Requires admin role.
 */
export function adminDelete(table: string) {
  requireAdminContext();
  return supabase.from(table).delete();
}
