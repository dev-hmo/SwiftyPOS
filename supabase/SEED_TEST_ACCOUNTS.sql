-- =============================================
-- FIX LOGIN + SETUP ROLES
-- =============================================
-- Problem: Supabase requires email confirmation before login.
-- "Invalid login credentials" = email not confirmed.
--
-- STEP 1: Sign up all 3 accounts through the app UI:
--   1. superadmin@swiftypos.com / admin123 / Business: "Super Admin"
--   2. admin@demo.com / admin123 / Business: "Demo Coffee Shop"
--   3. cashier@demo.com / admin123 / Business: "Cashier Demo"
--
-- STEP 2: Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- 1. Confirm all unconfirmed emails (fixes "Invalid login credentials")
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email IN ('superadmin@swiftypos.com', 'admin@demo.com', 'cashier@demo.com');

-- 2. Get IDs
DO $$
DECLARE
  sa_id UUID;
  ad_id UUID;
  ca_id UUID;
  ad_tenant UUID;
  ca_tenant UUID;
BEGIN
  SELECT id INTO sa_id FROM auth.users WHERE email = 'superadmin@swiftypos.com';
  SELECT id INTO ad_id FROM auth.users WHERE email = 'admin@demo.com';
  SELECT id INTO ca_id FROM auth.users WHERE email = 'cashier@demo.com';

  IF sa_id IS NULL OR ad_id IS NULL OR ca_id IS NULL THEN
    RAISE EXCEPTION 'Some accounts not found. Sign up all 3 first.';
  END IF;

  -- Get tenant created by admin signup
  SELECT tenant_id INTO ad_tenant FROM user_tenants WHERE user_id = ad_id LIMIT 1;

  -- Get tenant created by cashier signup (to delete later)
  SELECT tenant_id INTO ca_tenant FROM user_tenants WHERE user_id = ca_id LIMIT 1;

  -- 3. Super admin: remove from tenant, add to super_admins
  DELETE FROM user_tenants WHERE user_id = sa_id;
  INSERT INTO super_admins (user_id) VALUES (sa_id) ON CONFLICT DO NOTHING;

  -- 4. Cashier: move to admin's tenant
  DELETE FROM user_tenants WHERE user_id = ca_id;
  INSERT INTO user_tenants (user_id, tenant_id, role, is_active)
  VALUES (ca_id, ad_tenant, 'cashier', true)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'cashier', is_active = true;

  -- 5. Clean up orphan tenants
  DELETE FROM tenants WHERE id IN (sa_id, ca_tenant)
    AND id != ad_tenant;

  RAISE NOTICE 'Setup complete! Now log in with:';
  RAISE NOTICE '  Super Admin: superadmin@swiftypos.com / admin123 -> /super-admin';
  RAISE NOTICE '  Admin:       admin@demo.com / admin123 -> /admin';
  RAISE NOTICE '  Cashier:     cashier@demo.com / admin123 -> /pos';
END $$;
