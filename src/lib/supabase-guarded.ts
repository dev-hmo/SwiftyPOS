/**
 * Guarded Supabase access layer.
 *
 * Re-exports auth-scoped query helpers as the canonical way to access
 * Supabase tables. All queries MUST go through these functions.
 */
export {
  staffSelect,
  adminUpdate,
  adminDelete,
} from './auth-query';
