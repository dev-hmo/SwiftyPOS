-- POS & Inventory System Schema

-- Enable Row Level Security
-- roles: admin, manager, cashier

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
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

-- 2. Warehouses / Stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory Movements (Logs all changes)
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('inbound', 'outbound', 'adjustment', 'sale', 'return');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id),
  quantity INT NOT NULL,
  type movement_type NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sales Transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
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

-- 5. Sales Items (Line items)
CREATE TABLE IF NOT EXISTS sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs (Generic for user actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access" ON products;
DROP POLICY IF EXISTS "Managers can view and update products" ON products;
DROP POLICY IF EXISTS "Manager updates" ON products;
DROP POLICY IF EXISTS "Cashiers can view products" ON products;
DROP POLICY IF EXISTS "Cashiers can create sales" ON sales_transactions;

CREATE POLICY "Admins have full access" ON products FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Managers can view and update products" ON products FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Manager updates" ON products FOR UPDATE TO authenticated USING (auth.jwt() ->> 'role' = 'manager');
CREATE POLICY "Cashiers can view products" ON products FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Cashiers can create sales" ON sales_transactions FOR INSERT TO authenticated WITH CHECK (auth.jwt() ->> 'role' IN ('cashier', 'admin', 'manager'));

-- Functions & Triggers
CREATE OR REPLACE FUNCTION update_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN ('outbound', 'sale') THEN
    UPDATE products SET stock_quantity = stock_quantity - NEW.quantity WHERE id = NEW.product_id;
  ELSIF NEW.type IN ('inbound', 'return') THEN
    UPDATE products SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock ON inventory_movements;
CREATE TRIGGER tr_update_stock
AFTER INSERT ON inventory_movements
FOR EACH ROW EXECUTE FUNCTION update_stock_on_movement();
