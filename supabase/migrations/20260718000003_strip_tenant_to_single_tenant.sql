-- Migration: Strip Multi-Tenant SaaS → Single-Tenant Enterprise
-- Removes tenants, super_admins, tenant_id columns, and all tenant-scoped RLS.
-- Replaces with simple 3-role system: admin, cashier, kitchen.
--
-- EXECUTION ORDER: Run AFTER all previous migrations.
-- This migration is idempotent-safe (uses IF EXISTS / IF NOT EXISTS).

BEGIN;

-- ============================================================
-- 1. DROP ALL TENANT-SCOPED RLS POLICIES
-- ============================================================

-- Helper to drop policies safely
DO $$
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'products', 'stores', 'sales_transactions', 'sales_items',
      'inventory_movements', 'product_stocks', 'customers',
      'product_categories', 'product_variants', 'promotions',
      'business_settings', 'account_transactions', 'suppliers',
      'audit_logs', 'tenants', 'user_tenants', 'super_admins'
    ])
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- 2. DROP HELPER FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_tenant_role() CASCADE;
DROP FUNCTION IF EXISTS create_tenant_for_signup(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS current_user_is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS get_user_emails(UUID[]) CASCADE;

-- ============================================================
-- 3. DROP TENANT-SCOPED TABLES
-- ============================================================

DROP TABLE IF EXISTS super_admins CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ============================================================
-- 4. DROP TENANT_ID COLUMNS FROM ALL TABLES
-- ============================================================

ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE stores DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_transactions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE sales_items DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE customers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE inventory_movements DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_stocks DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_categories DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_variants DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE promotions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE business_settings DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE account_transactions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS tenant_id;

-- ============================================================
-- 5. DROP TENANT INDEXES
-- ============================================================

DROP INDEX IF EXISTS idx_products_tenant;
DROP INDEX IF EXISTS idx_stores_tenant;
DROP INDEX IF EXISTS idx_sales_tenant;
DROP INDEX IF EXISTS idx_sales_items_tenant;
DROP INDEX IF EXISTS idx_inventory_tenant;
DROP INDEX IF EXISTS idx_customers_tenant;
DROP INDEX IF EXISTS idx_suppliers_tenant;
DROP INDEX IF EXISTS idx_product_stocks_tenant;
DROP INDEX IF EXISTS idx_product_categories_tenant;
DROP INDEX IF EXISTS idx_product_variants_tenant;
DROP INDEX IF EXISTS idx_promotions_tenant;
DROP INDEX IF EXISTS idx_business_settings_tenant;
DROP INDEX IF EXISTS idx_account_transactions_tenant;
DROP INDEX IF EXISTS idx_audit_logs_tenant;
DROP INDEX IF EXISTS idx_tenants_slug;

-- ============================================================
-- 6. UPDATE USER_TENANTS TABLE (new 3-role system)
-- ============================================================

-- Step 1: Drop old CHECK constraint FIRST (allows all role values temporarily)
ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS user_tenants_role_check;

-- Step 2: Migrate existing roles to new system
UPDATE user_tenants SET role = 'admin' WHERE role = 'tenant_admin';
UPDATE user_tenants SET role = 'kitchen' WHERE role = 'manager';
-- Keep existing cashiers as-is (role = 'cashier')

-- Step 3: Add new CHECK constraint
ALTER TABLE user_tenants ADD CONSTRAINT user_tenants_role_check
  CHECK (role IN ('admin', 'cashier', 'kitchen'));

-- Step 4: Drop tenant_id and is_active columns (single-tenant: no longer needed)
-- Must drop the composite PK first (it references tenant_id)
ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS user_tenants_pkey;
ALTER TABLE user_tenants DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE user_tenants DROP COLUMN IF EXISTS is_active;
ALTER TABLE user_tenants DROP COLUMN IF EXISTS created_at;

-- Step 5: Add surrogate PK if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tenants' AND column_name = 'id'
  ) THEN
    ALTER TABLE user_tenants ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
  END IF;
END $$;

ALTER TABLE user_tenants ALTER COLUMN role SET NOT NULL;

-- ============================================================
-- 7. NEW HELPER FUNCTIONS
-- ============================================================

-- Returns the current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_tenants WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 8. NEW RLS POLICIES (Single-Tenant, Role-Based)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
DROP POLICY IF EXISTS "Authenticated users can view sales" ON sales_transactions;
DROP POLICY IF EXISTS "Cashiers and admins can insert sales" ON sales_transactions;
DROP POLICY IF EXISTS "Admins can manage sales" ON sales_transactions;
DROP POLICY IF EXISTS "Authenticated users can view sales_items" ON sales_items;
DROP POLICY IF EXISTS "Authenticated users can insert sales_items" ON sales_items;
DROP POLICY IF EXISTS "Admins can manage sales_items" ON sales_items;
DROP POLICY IF EXISTS "Authenticated users can view inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Admins can manage inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can view product_stocks" ON product_stocks;
DROP POLICY IF EXISTS "Admins can manage product_stocks" ON product_stocks;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Admins and cashiers can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view product_categories" ON product_categories;
DROP POLICY IF EXISTS "Admins can manage product_categories" ON product_categories;
DROP POLICY IF EXISTS "Authenticated users can view product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage product_variants" ON product_variants;
DROP POLICY IF EXISTS "Authenticated users can view promotions" ON promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can view business_settings" ON business_settings;
DROP POLICY IF EXISTS "Admins can manage business_settings" ON business_settings;
DROP POLICY IF EXISTS "Authenticated users can view account_transactions" ON account_transactions;
DROP POLICY IF EXISTS "Admins can manage account_transactions" ON account_transactions;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own role" ON user_tenants;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_tenants;

-- --- Products ---
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Stores ---
CREATE POLICY "Authenticated users can view stores"
  ON stores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Sales Transactions ---
CREATE POLICY "Authenticated users can view sales"
  ON sales_transactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Cashiers and admins can insert sales"
  ON sales_transactions FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Admins can manage sales"
  ON sales_transactions FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Sales Items ---
CREATE POLICY "Authenticated users can view sales_items"
  ON sales_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales_items"
  ON sales_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage sales_items"
  ON sales_items FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Inventory Movements ---
CREATE POLICY "Authenticated users can view inventory_movements"
  ON inventory_movements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage inventory_movements"
  ON inventory_movements FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Product Stocks ---
CREATE POLICY "Authenticated users can view product_stocks"
  ON product_stocks FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage product_stocks"
  ON product_stocks FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Customers ---
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins and cashiers can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (get_user_role() IN ('admin', 'cashier'))
  WITH CHECK (get_user_role() IN ('admin', 'cashier'));

-- --- Product Categories ---
CREATE POLICY "Authenticated users can view product_categories"
  ON product_categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage product_categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Product Variants ---
CREATE POLICY "Authenticated users can view product_variants"
  ON product_variants FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage product_variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Promotions ---
CREATE POLICY "Authenticated users can view promotions"
  ON promotions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Business Settings ---
CREATE POLICY "Authenticated users can view business_settings"
  ON business_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage business_settings"
  ON business_settings FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Account Transactions ---
CREATE POLICY "Authenticated users can view account_transactions"
  ON account_transactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage account_transactions"
  ON account_transactions FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Suppliers ---
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- Audit Logs ---
CREATE POLICY "Authenticated users can view audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit_logs"
  ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage audit_logs"
  ON audit_logs FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- --- User Tenants ---
CREATE POLICY "Users can view their own role"
  ON user_tenants FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
  ON user_tenants FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- 9. SEED: Create default admin user
-- ============================================================

-- This will be run manually after deployment:
-- INSERT INTO user_tenants (user_id, role)
-- SELECT id, 'admin' FROM auth.users
-- WHERE email = 'admin@yourdomain.com'
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. RECREATE get_user_emails RPC (dropped with old functions)
-- ============================================================

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

REVOKE EXECUTE ON FUNCTION get_user_emails(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;

-- ============================================================
-- 11. DROP UPGRADE_REQUESTS TABLE (no longer needed)
-- ============================================================

DROP TABLE IF EXISTS upgrade_requests CASCADE;

COMMIT;
