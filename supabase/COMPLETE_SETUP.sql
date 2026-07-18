-- =============================================
-- COMPLETE DATABASE SETUP — Run this ONE TIME
-- =============================================

-- =============================================
-- PHASE 1: Core POS Schema
-- =============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE movement_type AS ENUM ('inbound', 'outbound', 'adjustment', 'sale', 'return');

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  quantity INT NOT NULL,
  type movement_type NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  cashier_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access" ON products FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Cashiers can view products" ON products FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Cashiers can create sales" ON sales_transactions FOR INSERT TO authenticated WITH CHECK (TRUE);

-- =============================================
-- PHASE 2: Enterprise Features
-- =============================================

CREATE TABLE product_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  UNIQUE(product_id, store_id)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view all stocks" ON product_stocks FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin full access stocks" ON product_stocks FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Everyone can view promotions" ON promotions FOR SELECT TO authenticated USING (is_active = TRUE);

-- =============================================
-- PHASE 3: Accounting
-- =============================================

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'My Enterprise',
    business_type TEXT NOT NULL DEFAULT 'retail' CHECK (business_type IN ('retail', 'fb', 'service')),
    currency_code TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'DEBIT', 'CREDIT', 'REVENUE')),
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users on settings" ON business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for admins on settings" ON business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users in same store on transactions" ON account_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users on transactions" ON account_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- PHASE 4: Dynamic Products & Nested Categories
-- =============================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    price_override DECIMAL(10,2),
    cost_override DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users on categories" ON product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write for admins on categories" ON product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read for authenticated users on variants" ON product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write for admins on variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- PHASE 5: Tenants (multi-tenant isolation)
-- =============================================

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

-- Add tenant_id to all business tables
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

-- Helper functions
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

-- =============================================
-- PHASE 6: Strict RLS Policies
-- =============================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Admins have full access" ON products;
DROP POLICY IF EXISTS "Managers can view and update products" ON products;
DROP POLICY IF EXISTS "Cashiers can view products" ON products;
DROP POLICY IF EXISTS "Cashiers can create sales" ON sales_transactions;
DROP POLICY IF EXISTS "Admin full access stocks" ON product_stocks;
DROP POLICY IF EXISTS "Enable read access for authenticated users on settings" ON business_settings;
DROP POLICY IF EXISTS "Enable all access for admins on settings" ON business_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users in same store on transactions" ON account_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users on transactions" ON account_transactions;
DROP POLICY IF EXISTS "Enable read for authenticated users on categories" ON product_categories;
DROP POLICY IF EXISTS "Enable write for admins on categories" ON product_categories;
DROP POLICY IF EXISTS "Enable read for authenticated users on variants" ON product_variants;
DROP POLICY IF EXISTS "Enable write for admins on variants" ON product_variants;

-- Products
CREATE POLICY "Super admins full access on products" ON products FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view products" ON products FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage products" ON products FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Stores
CREATE POLICY "Super admins full access on stores" ON stores FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view stores" ON stores FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage stores" ON stores FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Sales Transactions
CREATE POLICY "Super admins full access on sales" ON sales_transactions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view sales" ON sales_transactions FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage sales" ON sales_transactions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));
CREATE POLICY "Cashiers can insert sales" ON sales_transactions FOR INSERT WITH CHECK (
  tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'cashier'
);

-- Sales Items
CREATE POLICY "Super admins full access on sales_items" ON sales_items FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view sales_items" ON sales_items FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant members insert sales_items" ON sales_items FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Inventory Movements
CREATE POLICY "Super admins full access on inventory_movements" ON inventory_movements FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view inventory_movements" ON inventory_movements FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage inventory_movements" ON inventory_movements FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Product Stocks
CREATE POLICY "Super admins full access on product_stocks" ON product_stocks FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view product_stocks" ON product_stocks FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage product_stocks" ON product_stocks FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Customers
CREATE POLICY "Super admins full access on customers" ON customers FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view customers" ON customers FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage customers" ON customers FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Product Categories
CREATE POLICY "Super admins full access on product_categories" ON product_categories FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view product_categories" ON product_categories FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage product_categories" ON product_categories FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Product Variants
CREATE POLICY "Super admins full access on product_variants" ON product_variants FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view product_variants" ON product_variants FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage product_variants" ON product_variants FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Promotions
CREATE POLICY "Super admins full access on promotions" ON promotions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view active promotions" ON promotions FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins manage promotions" ON promotions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin')
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

-- Business Settings
CREATE POLICY "Super admins full access on business_settings" ON business_settings FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view business_settings" ON business_settings FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins manage business_settings" ON business_settings FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin')
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

-- Account Transactions
CREATE POLICY "Super admins full access on account_transactions" ON account_transactions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view account_transactions" ON account_transactions FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage account_transactions" ON account_transactions FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins full access on audit_logs" ON audit_logs FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant admins view audit_logs" ON audit_logs FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant members insert audit_logs" ON audit_logs FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins full access on suppliers" ON suppliers FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant members view suppliers" ON suppliers FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Tenant admins and managers manage suppliers" ON suppliers FOR ALL
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'))
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() IN ('tenant_admin', 'manager'));

-- Tenants (super admin only)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins full access on tenants" ON tenants FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Tenant admins view own tenant" ON tenants FOR SELECT USING (id = get_user_tenant_id());
-- Signup flow: restrict INSERT to service_role only (handled by backend edge function)
-- For client-side signup, use a SECURITY DEFINER function instead:

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

-- User Tenants
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins full access on user_tenants" ON user_tenants FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "Users can view their own memberships" ON user_tenants FOR SELECT USING (user_id = auth.uid());
-- No direct INSERT policy — signup uses the create_tenant_for_signup() function

-- Super Admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
-- Use a SECURITY DEFINER function to check super admin status without leaking UUIDs
CREATE OR REPLACE FUNCTION current_user_is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- No SELECT policy on super_admins — only super admins and the function can access it
CREATE POLICY "Super admins manage super_admins" ON super_admins FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- =============================================
-- PHASE 7: Indexes
-- =============================================

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

-- =============================================
-- PHASE 8: Default seed data
-- =============================================

-- Create a default tenant for first signup
-- (signup flow also creates one, this is just a fallback)
