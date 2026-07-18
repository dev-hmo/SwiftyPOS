-- Migration: Dynamic Products & Nested Categories

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id),
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    price_override DECIMAL(10,2),
    cost_override DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable read for authenticated users on categories"
    ON product_categories FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable write for admins on categories"
    ON product_categories FOR ALL TO authenticated
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable read for authenticated users on variants"
    ON product_variants FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable write for admins on variants"
    ON product_variants FOR ALL TO authenticated
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;
