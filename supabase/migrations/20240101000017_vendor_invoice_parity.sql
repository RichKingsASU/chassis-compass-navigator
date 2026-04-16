-- ============================================================================
-- Migration: Vendor invoice parity tables (CCM, TRAC, FLEXIVAN)
-- Description: Creates ccm_invoice, ccm_invoice_data, trac_invoice,
--   trac_invoice_data, flexivan_invoice, flexivan_invoice_data using the
--   same schema as wccp_invoice / wccp_invoice_data so the shared invoice
--   upload wizard works locally for all five non-DCLI vendors.
--
--   The earlier validation RPC (migration 7) already references
--   ccm_invoice / trac_invoice without creating them locally — this
--   migration closes that gap.
-- ============================================================================

-- ─────────────────────────────────────────
-- CCM
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ccm_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'CCM',
  total_amount_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ccm_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES ccm_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TRAC
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trac_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'TRAC',
  total_amount_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trac_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES trac_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- FLEXIVAN
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flexivan_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'FLEXIVAN',
  total_amount_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flexivan_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES flexivan_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- Add notes column to existing wccp/scspa invoice tables for parity
-- ─────────────────────────────────────────
ALTER TABLE wccp_invoice  ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE scspa_invoice ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ccm_invoice_number      ON ccm_invoice(invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_trac_invoice_number     ON trac_invoice(invoice_number);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_flexivan_invoice_number ON flexivan_invoice(invoice_number);

CREATE INDEX IF NOT EXISTS idx_ccm_invoice_data_invoice_id      ON ccm_invoice_data(invoice_id);
CREATE INDEX IF NOT EXISTS idx_trac_invoice_data_invoice_id     ON trac_invoice_data(invoice_id);
CREATE INDEX IF NOT EXISTS idx_flexivan_invoice_data_invoice_id ON flexivan_invoice_data(invoice_id);

-- ─────────────────────────────────────────
-- RLS: enable + permissive read/write policies (matches wccp/scspa pattern)
-- ─────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ccm_invoice',      'ccm_invoice_data',
      'trac_invoice',     'trac_invoice_data',
      'flexivan_invoice', 'flexivan_invoice_data'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_read', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      tbl || '_read', tbl
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_write', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl || '_write', tbl
    );
  END LOOP;
END $$;
