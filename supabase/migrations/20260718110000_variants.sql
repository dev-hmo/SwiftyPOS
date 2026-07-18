-- =============================================================
-- Migration: Variants — option groups, options, product links
-- Idempotent — safe to re-run
-- =============================================================

-- 1. VARIANTS — option groups (e.g. "Size", "Sugar Level")
CREATE TABLE IF NOT EXISTS variants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. VARIANT OPTIONS — individual choices within a group
CREATE TABLE IF NOT EXISTS variant_options (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id     UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  price_modifier NUMERIC NOT NULL DEFAULT 0,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCT VARIANTS — links products to which variant options they support
CREATE TABLE IF NOT EXISTS product_variants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, variant_option_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variant_options_variant      ON variant_options(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product     ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_option      ON product_variants(variant_option_id);

-- RLS
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "variants_select" ON variants;
  DROP POLICY IF EXISTS "variants_insert" ON variants;
  DROP POLICY IF EXISTS "variants_update" ON variants;
  DROP POLICY IF EXISTS "variants_delete" ON variants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "variants_select" ON variants
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "variants_insert" ON variants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "variants_update" ON variants
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "variants_delete" ON variants
  FOR DELETE USING (auth.role() = 'authenticated');

DO $$ BEGIN
  DROP POLICY IF EXISTS "variant_options_select" ON variant_options;
  DROP POLICY IF EXISTS "variant_options_insert" ON variant_options;
  DROP POLICY IF EXISTS "variant_options_update" ON variant_options;
  DROP POLICY IF EXISTS "variant_options_delete" ON variant_options;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "variant_options_select" ON variant_options
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "variant_options_insert" ON variant_options
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "variant_options_update" ON variant_options
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "variant_options_delete" ON variant_options
  FOR DELETE USING (auth.role() = 'authenticated');

DO $$ BEGIN
  DROP POLICY IF EXISTS "product_variants_select" ON product_variants;
  DROP POLICY IF EXISTS "product_variants_insert" ON product_variants;
  DROP POLICY IF EXISTS "product_variants_delete" ON product_variants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "product_variants_select" ON product_variants
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "product_variants_insert" ON product_variants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "product_variants_delete" ON product_variants
  FOR DELETE USING (auth.role() = 'authenticated');

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS variants_updated_at ON variants;
CREATE TRIGGER variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variants_updated_at();
