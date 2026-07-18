-- =============================================
-- SETUP: Create tenant + roles (no hardcoded IDs)
-- =============================================

-- 1. Create the missing RPC function
CREATE OR REPLACE FUNCTION create_tenant_for_signup(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  INSERT INTO tenants (name, slug, plan, subscription_status, trial_ends_at)
  VALUES (p_name, p_slug, 'free', 'trial', NOW() + interval '14 days')
  RETURNING id INTO new_tenant_id;

  INSERT INTO user_tenants (user_id, tenant_id, role, is_active)
  VALUES (auth.uid(), new_tenant_id, 'tenant_admin', true);

  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Everything else via email lookup
DO $$
DECLARE
  new_tenant_id UUID;
  sa_id UUID;
  ad_id UUID;
  ca_id UUID;
BEGIN
  SELECT id INTO sa_id FROM auth.users WHERE email = 'superadmin@swiftypos.com';
  SELECT id INTO ad_id FROM auth.users WHERE email = 'admin@demo.com';
  SELECT id INTO ca_id FROM auth.users WHERE email = 'cashier@demo.com';

  IF ad_id IS NULL THEN RAISE EXCEPTION 'admin@demo.com not found'; END IF;
  IF ca_id IS NULL THEN RAISE EXCEPTION 'cashier@demo.com not found'; END IF;

  -- Create demo tenant
  INSERT INTO tenants (name, slug, plan, subscription_status)
  VALUES ('Demo Coffee Shop', 'demo-coffee-shop', 'pro', 'active')
  RETURNING id INTO new_tenant_id;

  -- Admin owns it
  INSERT INTO user_tenants (user_id, tenant_id, role, is_active)
  VALUES (ad_id, new_tenant_id, 'tenant_admin', true);

  -- Cashier works there
  INSERT INTO user_tenants (user_id, tenant_id, role, is_active)
  VALUES (ca_id, new_tenant_id, 'cashier', true);

  -- Super admin
  IF sa_id IS NOT NULL THEN
    INSERT INTO super_admins (user_id) VALUES (sa_id) ON CONFLICT DO NOTHING;
  END IF;

  -- Demo store
  INSERT INTO stores (name, location, is_active, tenant_id)
  VALUES ('Main Branch', '123 Demo Street', true, new_tenant_id);

  -- Demo products
  INSERT INTO products (sku, name, description, category, price, cost_price, stock_quantity, tenant_id)
  VALUES
    ('COF-001', 'Espresso', 'Classic espresso', 'Coffee', 18.00, 5.00, 100, new_tenant_id),
    ('COF-002', 'Caramel Macchiato', 'Caramel & milk', 'Coffee', 16.50, 6.00, 80, new_tenant_id),
    ('TEA-001', 'Green Tea', 'Premium green tea', 'Tea', 12.00, 3.00, 60, new_tenant_id),
    ('COF-003', 'Cold Brew', 'Slow-steeped cold brew', 'Coffee', 14.00, 4.50, 50, new_tenant_id),
    ('PAS-001', 'Croissant', 'Butter croissant', 'Pastries', 4.50, 1.50, 45, new_tenant_id),
    ('EQU-001', 'Brew Kit', 'Home brew kit', 'Equipment', 35.00, 15.00, 12, new_tenant_id);

  -- Business settings
  INSERT INTO business_settings (business_name, business_type, currency_code, currency_symbol, tax_rate, tenant_id)
  VALUES ('Demo Coffee Shop', 'fb', 'MMK', 'K', 5, new_tenant_id);

  RAISE NOTICE 'Done! Tenant: %, Admin: %, Cashier: %, SuperAdmin: %', new_tenant_id, ad_id, ca_id, sa_id;
END $$;
