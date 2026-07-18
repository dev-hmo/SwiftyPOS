-- Migration: Tenant Isolation
-- Adds multi-tenant data model: tenants, user_tenants, super_admins tables.
-- Adds tenant_id to all business tables.
-- Implements strict RLS policies with tenant scoping.
-- Compatible with PostgreSQL 15+ (uses WITH CHECK for FOR ALL policies).

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','standard','pro','enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('active','trial','expired','suspended')),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_tenants (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('tenant_admin','manager','cashier')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ADD tenant_id TO EXISTING TABLES
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_stocks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE account_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_tenants
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_tenant_role()
RETURNS TEXT AS $$
  SELECT role FROM user_tenants
  WHERE user_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SECURITY DEFINER function for tenant signup (replaces permissive INSERT policies)
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

-- ============================================================
-- 4. RLS POLICIES (drop old permissive ones, add strict tenant-scoped ones)
-- ============================================================

-- --- Products ---
DROP POLICY IF EXISTS "Admins have full access" ON products;
DROP POLICY IF EXISTS "Managers can view and update products" ON products;
DROP POLICY IF EXISTS "Cashiers can view products" ON products;

CREATE POLICY "Super admins full access on products"
  ON products FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view products"
  ON products FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage products"
  ON products FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Stores ---
CREATE POLICY "Super admins full access on stores"
  ON stores FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view stores"
  ON stores FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage stores"
  ON stores FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Sales Transactions ---
DROP POLICY IF EXISTS "Cashiers can create sales" ON sales_transactions;

CREATE POLICY "Super admins full access on sales"
  ON sales_transactions FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view sales"
  ON sales_transactions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage sales"
  ON sales_transactions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

CREATE POLICY "Cashiers can insert sales"
  ON sales_transactions FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'cashier');

-- --- Sales Items ---
CREATE POLICY "Super admins full access on sales_items"
  ON sales_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view sales_items"
  ON sales_items FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant members insert sales_items"
  ON sales_items FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- --- Inventory Movements ---
CREATE POLICY "Super admins full access on inventory_movements"
  ON inventory_movements FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view inventory_movements"
  ON inventory_movements FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage inventory_movements"
  ON inventory_movements FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Product Stocks ---
DROP POLICY IF EXISTS "Admin full access stocks" ON product_stocks;
DROP POLICY IF EXISTS "Managers can view all stocks" ON product_stocks;

CREATE POLICY "Super admins full access on product_stocks"
  ON product_stocks FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view product_stocks"
  ON product_stocks FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage product_stocks"
  ON product_stocks FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Customers ---
CREATE POLICY "Super admins full access on customers"
  ON customers FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view customers"
  ON customers FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage customers"
  ON customers FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Product Categories ---
DROP POLICY IF EXISTS "Enable read for authenticated users on categories" ON product_categories;
DROP POLICY IF EXISTS "Enable write for admins on categories" ON product_categories;

CREATE POLICY "Super admins full access on product_categories"
  ON product_categories FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view product_categories"
  ON product_categories FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage product_categories"
  ON product_categories FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Product Variants ---
DROP POLICY IF EXISTS "Enable read for authenticated users on variants" ON product_variants;
DROP POLICY IF EXISTS "Enable write for admins on variants" ON product_variants;

CREATE POLICY "Super admins full access on product_variants"
  ON product_variants FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view product_variants"
  ON product_variants FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage product_variants"
  ON product_variants FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Promotions ---
CREATE POLICY "Super admins full access on promotions"
  ON promotions FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view active promotions"
  ON promotions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins manage promotions"
  ON promotions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin')
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

-- --- Business Settings ---
DROP POLICY IF EXISTS "Enable read access for authenticated users on settings" ON business_settings;
DROP POLICY IF EXISTS "Enable all access for admins on settings" ON business_settings;

CREATE POLICY "Super admins full access on business_settings"
  ON business_settings FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view business_settings"
  ON business_settings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins manage business_settings"
  ON business_settings FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin')
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

-- --- Account Transactions ---
DROP POLICY IF EXISTS "Enable read access for authenticated users in same store on transactions" ON account_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users on transactions" ON account_transactions;

CREATE POLICY "Super admins full access on account_transactions"
  ON account_transactions FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view account_transactions"
  ON account_transactions FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage account_transactions"
  ON account_transactions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Suppliers ---
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access on suppliers"
  ON suppliers FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant members view suppliers"
  ON suppliers FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant admins and managers manage suppliers"
  ON suppliers FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- --- Audit Logs ---
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access on audit_logs"
  ON audit_logs FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant admins view audit_logs"
  ON audit_logs FOR SELECT
  USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant members insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id());

-- --- Tenants ---
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access on tenants"
  ON tenants FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Tenant admins view own tenant"
  ON tenants FOR SELECT
  USING (id = get_user_tenant_id());
-- No INSERT policy — signup uses create_tenant_for_signup() SECURITY DEFINER function

-- --- User Tenants ---
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access on user_tenants"
  ON user_tenants FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users can view their own memberships"
  ON user_tenants FOR SELECT
  USING (user_id = auth.uid());
-- No INSERT policy — signup uses create_tenant_for_signup() SECURITY DEFINER function

-- --- Super Admins ---
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
-- SECURITY DEFINER function for super admin check (avoids UUID leaks)
CREATE OR REPLACE FUNCTION current_user_is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- No SELECT policy — only super admins and the function can access this table
CREATE POLICY "Super admins manage super_admins"
  ON super_admins FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_tenant ON sales_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_stocks_tenant ON product_stocks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_tenant ON promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_tenant ON business_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_tenant ON account_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_sales_items_transaction ON sales_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store ON inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_cashier ON sales_transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
