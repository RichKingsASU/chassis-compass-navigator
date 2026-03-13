-- ============================================================================
-- Migration: Add missing tables referenced by the UI and ensure RLS coverage
-- Description: Creates portpro_tms, activity_log, validation_results,
--   ytd_loads, yard_events_data, wccp_invoice, wccp_invoice_data, wccp_activity,
--   scspa_invoice, scspa_invoice_data, and adds RLS read policies to all tables.
-- ============================================================================

-- ─────────────────────────────────────────
-- TABLE: portpro_tms — Port Pro TMS data
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portpro_tms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number TEXT,
  chassis_number TEXT,
  container_number TEXT,
  pickup_date DATE,
  delivery_date DATE,
  carrier TEXT,
  customer TEXT,
  terminal TEXT,
  status TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: activity_log — System activity log for dashboard
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: validation_results — Cross-validation between invoices and TMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_number TEXT,
  vendor TEXT,
  invoice_number TEXT,
  invoice_amount NUMERIC(10,2),
  tms_amount NUMERIC(10,2),
  variance NUMERIC(10,2),
  status TEXT DEFAULT 'pending',
  match_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: ytd_loads — Year-to-date loads summary
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ytd_loads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ld_num TEXT,
  so_num TEXT,
  chassis_number TEXT,
  container_number TEXT,
  customer_name TEXT,
  carrier_name TEXT,
  status TEXT,
  pickup_actual_date TEXT,
  delivery_actual_date TEXT,
  cust_rate_charge NUMERIC(10,2),
  cust_invoice_charge NUMERIC(10,2),
  pickup_loc_name TEXT,
  delivery_loc_name TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: yard_events_data — Yard event tracking
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yard_events_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chassis_number TEXT,
  container_number TEXT,
  yard TEXT,
  event_type TEXT,
  event_date TIMESTAMPTZ,
  gate_in TIMESTAMPTZ,
  gate_out TIMESTAMPTZ,
  dwell_days INTEGER,
  status TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: wccp_invoice — WCCP vendor invoices
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wccp_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'WCCP',
  total_amount_usd DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: wccp_invoice_data — Parsed data for WCCP invoices
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wccp_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES wccp_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: wccp_activity — WCCP activity log
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wccp_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number TEXT,
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  invoice_amount NUMERIC,
  amount_paid NUMERIC,
  amount_due NUMERIC,
  invoice_status TEXT,
  invoice_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: scspa_invoice — SCSPA vendor invoices
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scspa_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'SCSPA',
  total_amount_usd DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  reason_for_dispute TEXT,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: scspa_invoice_data — Parsed data for SCSPA invoices
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scspa_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES scspa_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- TABLE: dcli_invoice_data — alias for dcli_invoice_line_item used in UI
-- ─────────────────────────────────────────
-- The UI references dcli_invoice_data but migration 1 creates dcli_invoice_line_item.
-- Create a view so both names work.
CREATE OR REPLACE VIEW dcli_invoice_data AS
  SELECT * FROM dcli_invoice_line_item;

-- ─────────────────────────────────────────
-- INDEXES for new tables
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portpro_tms_chassis ON portpro_tms(chassis_number);
CREATE INDEX IF NOT EXISTS idx_portpro_tms_created ON portpro_tms(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_validation_results_chassis ON validation_results(chassis_number);
CREATE INDEX IF NOT EXISTS idx_ytd_loads_chassis ON ytd_loads(chassis_number);
CREATE INDEX IF NOT EXISTS idx_yard_events_data_chassis ON yard_events_data(chassis_number);
CREATE INDEX IF NOT EXISTS idx_yard_events_data_yard ON yard_events_data(yard);

-- ─────────────────────────────────────────
-- RLS: Enable on ALL new tables with public read
-- ─────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'portpro_tms',
      'activity_log',
      'validation_results',
      'ytd_loads',
      'yard_events_data',
      'wccp_invoice',
      'wccp_invoice_data',
      'wccp_activity',
      'scspa_invoice',
      'scspa_invoice_data'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow all access" ON %I; CREATE POLICY "Allow all access" ON %I FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl
    );
  END LOOP;
END;
$$;
