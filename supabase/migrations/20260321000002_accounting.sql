-- Migration: Accounting & General Settings

CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'My Enterprise',
    business_type TEXT NOT NULL DEFAULT 'retail' CHECK (business_type IN ('retail', 'fb', 'service')),
    currency_code TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO business_settings (business_name) VALUES ('Default Business Config')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'DEBIT', 'CREDIT', 'REVENUE')),
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Enable read access for authenticated users on settings"
    ON business_settings FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable all access for admins on settings"
    ON business_settings FOR ALL TO authenticated
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable read access for authenticated users in same store on transactions"
    ON account_transactions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Enable insert for authenticated users on transactions"
    ON account_transactions FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
