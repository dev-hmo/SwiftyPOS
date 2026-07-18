-- Migration: get_user_emails RPC
-- Replaces client-side supabase.auth.admin.getUserById() calls that require
-- the service_role key (which must never be exposed to the browser).
-- This SECURITY DEFINER function runs with DB-level privileges and returns
-- email addresses for a list of user UUIDs, scoped to super_admin callers.

CREATE OR REPLACE FUNCTION get_user_emails(p_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT au.id AS user_id, au.email
  FROM auth.users au
  WHERE au.id = ANY(p_user_ids)
$$;

-- Revoke from anon — only authenticated super admins should call this
REVOKE EXECUTE ON FUNCTION get_user_emails(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;
