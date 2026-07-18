-- Phase 2: Enterprise Enhancements

-- 1. Store-specific Stock (Multi-warehouse)
CREATE TABLE IF NOT EXISTS product_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  UNIQUE(product_id, store_id)
);

-- 2. Customer Loyalty Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Discounts & Promotions
CREATE TABLE IF NOT EXISTS promotions (
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

-- 4. Advanced Audit Logs Triggers
CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    'product',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_log_product_changes ON products;
CREATE TRIGGER tr_log_product_changes
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_product_changes();

-- 5. RLS
ALTER TABLE product_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view all stocks" ON product_stocks;
DROP POLICY IF EXISTS "Admin full access stocks" ON product_stocks;
DROP POLICY IF EXISTS "Everyone can view promotions" ON promotions;

CREATE POLICY "Managers can view all stocks" ON product_stocks FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin full access stocks" ON product_stocks FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Everyone can view promotions" ON promotions FOR SELECT TO authenticated USING (is_active = TRUE);
