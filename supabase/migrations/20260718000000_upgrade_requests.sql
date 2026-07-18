-- ============================================
-- UPGRADE REQUESTS: Plan upgrade approval workflow
-- ============================================

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES auth.users(id),
  current_plan    TEXT NOT NULL CHECK (current_plan IN ('free','standard','pro','enterprise')),
  requested_plan  TEXT NOT NULL CHECK (requested_plan IN ('free','standard','pro','enterprise')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','denied')),
  payment_method  TEXT,
  transaction_id  TEXT,
  screenshot_url  TEXT,
  amount          DECIMAL(12,2),
  denial_reason   TEXT,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_tenant ON upgrade_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_created ON upgrade_requests(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Super admins: full access
CREATE POLICY "Super admins full access on upgrade_requests"
  ON upgrade_requests FOR ALL
  USING (is_super_admin());

-- Tenant admins: can view their own requests and insert new ones
CREATE POLICY "Tenant admins view own upgrade requests"
  ON upgrade_requests FOR SELECT
  USING (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

CREATE POLICY "Tenant admins insert upgrade requests"
  ON upgrade_requests FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() AND get_user_tenant_role() = 'tenant_admin');

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_upgrade_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_upgrade_requests_updated
  BEFORE UPDATE ON upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION update_upgrade_request_timestamp();
