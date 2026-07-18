-- =============================================================
-- Migration: Inventory expansion — ingredients, recipes, stock
-- Idempotent — safe to re-run
-- =============================================================

-- 1. INGREDIENTS — raw materials tracked by the kitchen
CREATE TABLE IF NOT EXISTS ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  sku           TEXT UNIQUE NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'g',   -- g, kg, ml, L, pcs
  current_stock NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  cost_per_unit NUMERIC NOT NULL DEFAULT 0   CHECK (cost_per_unit >= 0),
  min_stock_alert NUMERIC NOT NULL DEFAULT 0 CHECK (min_stock_alert >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PRODUCT RECIPES — many-to-many: product → ingredient + quantity per unit
CREATE TABLE IF NOT EXISTS product_recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity      NUMERIC NOT NULL CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, ingredient_id)
);

-- 3. STOCK HISTORY — every inbound / outbound / adjustment logged
CREATE TABLE IF NOT EXISTS stock_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id  UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  change_type    TEXT NOT NULL CHECK (change_type IN ('purchase', 'sale', 'adjustment', 'waste', 'opening')),
  quantity_delta NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL,
  new_stock      NUMERIC NOT NULL,
  note           TEXT,
  user_id        UUID,
  transaction_id UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_recipes_product   ON product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_ingredient ON product_recipes(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_ingredient   ON stock_history(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created      ON stock_history(created_at DESC);

-- RLS — mirror products policy (admin full access, staff read)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Drop + recreate policies to stay idempotent
DO $$ BEGIN
  DROP POLICY IF EXISTS "ingredients_select" ON ingredients;
  DROP POLICY IF EXISTS "ingredients_insert" ON ingredients;
  DROP POLICY IF EXISTS "ingredients_update" ON ingredients;
  DROP POLICY IF EXISTS "ingredients_delete" ON ingredients;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "ingredients_select" ON ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ingredients_insert" ON ingredients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ingredients_update" ON ingredients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "ingredients_delete" ON ingredients
  FOR DELETE USING (auth.role() = 'authenticated');

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_recipes_select" ON product_recipes;
  DROP POLICY IF EXISTS "product_recipes_insert" ON product_recipes;
  DROP POLICY IF EXISTS "product_recipes_delete" ON product_recipes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "product_recipes_select" ON product_recipes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "product_recipes_insert" ON product_recipes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_recipes_delete" ON product_recipes
  FOR DELETE USING (auth.role() = 'authenticated');

DO $$ BEGIN
  DROP POLICY IF EXISTS "stock_history_select" ON stock_history;
  DROP POLICY IF EXISTS "stock_history_insert" ON stock_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "stock_history_select" ON stock_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "stock_history_insert" ON stock_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- updated_at trigger for ingredients
CREATE OR REPLACE FUNCTION update_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ingredients_updated_at ON ingredients;
CREATE TRIGGER ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredients_updated_at();
