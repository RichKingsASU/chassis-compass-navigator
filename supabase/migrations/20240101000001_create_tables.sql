-- ============================================================================
-- Migration: Create all tables, functions, triggers, indexes, and RLS policies
-- Description: Consolidated schema for Chassis Compass Navigator
-- ============================================================================

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. ccm_invoice - CCM vendor invoices
CREATE TABLE IF NOT EXISTS ccm_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'CCM',
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

-- 2. ccm_invoice_data - Parsed Excel data for CCM invoices
CREATE TABLE IF NOT EXISTS ccm_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES ccm_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ccm_activity - CCM activity log
CREATE TABLE IF NOT EXISTS ccm_activity (
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

-- 4. dcli_invoice - DCLI vendor invoices
CREATE TABLE IF NOT EXISTS dcli_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  billing_date DATE,
  account_code TEXT,
  total_amount NUMERIC,
  status TEXT DEFAULT 'pending',
  vendor TEXT DEFAULT 'DCLI',
  file_name TEXT,
  file_type TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. dcli_invoice_line_item - DCLI invoice line items
CREATE TABLE IF NOT EXISTS dcli_invoice_line_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES dcli_invoice(id) ON DELETE CASCADE,
  line_invoice_number TEXT,
  chassis TEXT,
  container TEXT,
  date_out DATE,
  date_in DATE,
  days_used INTEGER,
  daily_rate NUMERIC,
  line_total NUMERIC,
  match_type TEXT,
  match_confidence INTEGER,
  tms_match JSONB,
  row_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. dcli_invoice_staging - DCLI invoice staging before validation
CREATE TABLE IF NOT EXISTS dcli_invoice_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_invoice_id TEXT NOT NULL,
  invoice_date DATE,
  due_date DATE,
  billing_date DATE,
  account_code TEXT,
  vendor TEXT DEFAULT 'DCLI',
  total_amount NUMERIC,
  status TEXT DEFAULT 'staged',
  currency TEXT DEFAULT 'USD',
  attachments JSONB DEFAULT '[]',
  line_items JSONB NOT NULL DEFAULT '[]',
  excel_headers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. dcli_activity - DCLI activity log
CREATE TABLE IF NOT EXISTS dcli_activity (
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

-- 8. trac_invoice - TRAC vendor invoices
CREATE TABLE IF NOT EXISTS trac_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'TRAC',
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

-- 9. trac_invoice_data - Parsed Excel data for TRAC invoices
CREATE TABLE IF NOT EXISTS trac_invoice_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES trac_invoice(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. trac_invoice_staging - TRAC invoice staging before validation
CREATE TABLE IF NOT EXISTS trac_invoice_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_invoice_id TEXT NOT NULL,
  invoice_date DATE,
  due_date DATE,
  billing_date DATE,
  account_code TEXT,
  vendor TEXT DEFAULT 'TRAC',
  total_amount NUMERIC,
  status TEXT DEFAULT 'staged',
  currency TEXT DEFAULT 'USD',
  attachments JSONB DEFAULT '[]',
  line_items JSONB NOT NULL DEFAULT '[]',
  excel_headers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. trac_activity - TRAC activity log
CREATE TABLE IF NOT EXISTS trac_activity (
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

-- 12. trac_customer_information
CREATE TABLE IF NOT EXISTS trac_customer_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. trac_debtor_transactions
CREATE TABLE IF NOT EXISTS trac_debtor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. trac_invoice_lines
CREATE TABLE IF NOT EXISTS trac_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID,
  line_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. trac_invoices
CREATE TABLE IF NOT EXISTS trac_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. trac_receipts
CREATE TABLE IF NOT EXISTS trac_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. flexivan-dispute (hyphenated table name requires quoting)
CREATE TABLE IF NOT EXISTS "flexivan-dispute" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dispute_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. flexivan-invoices
CREATE TABLE IF NOT EXISTS "flexivan-invoices" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. flexivan-outstanding
CREATE TABLE IF NOT EXISTS "flexivan-outstanding" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  outstanding_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. flexivan-payhistory
CREATE TABLE IF NOT EXISTS "flexivan-payhistory" (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. flexivan_activity
CREATE TABLE IF NOT EXISTS flexivan_activity (
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

-- 22. scspa_activity
CREATE TABLE IF NOT EXISTS scspa_activity (
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

-- 23. mg_tms - Mercury Gate TMS data
CREATE TABLE IF NOT EXISTS mg_tms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ld_num TEXT,
  so_num TEXT,
  shipment_number TEXT,
  chassis_number TEXT,
  container_number TEXT,
  pickup_actual_date TEXT,
  delivery_actual_date TEXT,
  carrier_name TEXT,
  customer_name TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. invoices - Generic invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  vendor TEXT,
  total_amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 25. invoice_lines - Invoice line items for validation
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  match_score NUMERIC(5,2) DEFAULT 0,
  exact_match BOOLEAN DEFAULT false,
  mismatch_reasons JSONB DEFAULT '[]',
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  dispute_status TEXT,
  dispute_history JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 26. gps_uploads - GPS upload metadata
CREATE TABLE IF NOT EXISTS gps_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  data_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 27. gps_data - Parsed GPS data
CREATE TABLE IF NOT EXISTS gps_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES gps_uploads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  device_id TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  battery_level INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ADDITIONAL FUNCTIONS
-- ============================================================================

-- validate_dcli_invoice: Matches DCLI invoice lines against mg_tms data
CREATE OR REPLACE FUNCTION validate_dcli_invoice(
  p_summary_invoice_id TEXT,
  p_account_code TEXT,
  p_billing_date DATE,
  p_due_date DATE,
  p_line_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_line JSONB;
  v_matched_rows JSONB := '[]'::JSONB;
  v_exact_count INT := 0;
  v_fuzzy_count INT := 0;
  v_mismatch_count INT := 0;
  v_tms_row RECORD;
  v_chassis TEXT;
  v_container TEXT;
  v_match_type TEXT;
  v_match_confidence INT;
  v_tms_match JSONB;
BEGIN
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    v_chassis := LOWER(TRIM(v_line->>'chassis'));
    v_container := LOWER(TRIM(v_line->>'container'));
    v_match_type := 'mismatch';
    v_match_confidence := 0;
    v_tms_match := NULL;

    -- Try exact match on chassis number
    SELECT * INTO v_tms_row
    FROM mg_tms
    WHERE LOWER(TRIM(chassis_number)) = v_chassis
    LIMIT 1;

    IF FOUND THEN
      v_match_type := 'exact';
      v_match_confidence := 100;
      v_tms_match := jsonb_build_object(
        'ld_num', v_tms_row.ld_num,
        'so_num', v_tms_row.so_num,
        'shipment_number', v_tms_row.shipment_number,
        'chassis_number', v_tms_row.chassis_number,
        'container_number', v_tms_row.container_number,
        'pickup_actual_date', v_tms_row.pickup_actual_date,
        'delivery_actual_date', v_tms_row.delivery_actual_date,
        'carrier_name', v_tms_row.carrier_name,
        'customer_name', v_tms_row.customer_name
      );
      v_exact_count := v_exact_count + 1;
    ELSE
      -- Try fuzzy match on container number
      SELECT * INTO v_tms_row
      FROM mg_tms
      WHERE LOWER(TRIM(container_number)) = v_container
      LIMIT 1;

      IF FOUND THEN
        v_match_type := 'fuzzy';
        v_match_confidence := 75;
        v_tms_match := jsonb_build_object(
          'ld_num', v_tms_row.ld_num,
          'so_num', v_tms_row.so_num,
          'shipment_number', v_tms_row.shipment_number,
          'chassis_number', v_tms_row.chassis_number,
          'container_number', v_tms_row.container_number,
          'pickup_actual_date', v_tms_row.pickup_actual_date,
          'delivery_actual_date', v_tms_row.delivery_actual_date,
          'carrier_name', v_tms_row.carrier_name,
          'customer_name', v_tms_row.customer_name
        );
        v_fuzzy_count := v_fuzzy_count + 1;
      ELSE
        v_mismatch_count := v_mismatch_count + 1;
      END IF;
    END IF;

    v_matched_rows := v_matched_rows || jsonb_build_object(
      'line_data', v_line,
      'match_type', v_match_type,
      'match_confidence', v_match_confidence,
      'tms_match', v_tms_match
    );
  END LOOP;

  v_result := jsonb_build_object(
    'summary', jsonb_build_object(
      'total_lines', jsonb_array_length(p_line_items),
      'exact_matches', v_exact_count,
      'fuzzy_matches', v_fuzzy_count,
      'mismatches', v_mismatch_count,
      'summary_invoice_id', p_summary_invoice_id,
      'account_code', p_account_code,
      'billing_date', p_billing_date,
      'due_date', p_due_date
    ),
    'rows', v_matched_rows
  );

  RETURN v_result;
END;
$$;

-- validate_invoice_line: Updates invoice_lines status to 'validated'
CREATE OR REPLACE FUNCTION validate_invoice_line(line_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invoice_lines
  SET status = 'validated',
      validated_at = now()
  WHERE id = line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice line not found: %', line_id;
  END IF;
END;
$$;

-- open_dispute: Opens a dispute on an invoice line
CREATE OR REPLACE FUNCTION open_dispute(line_id UUID, reason TEXT, note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invoice_lines
  SET dispute_status = 'open',
      status = 'disputed',
      notes = note,
      dispute_history = dispute_history || jsonb_build_object(
        'action', 'opened',
        'reason', reason,
        'note', note,
        'timestamp', now()
      )
  WHERE id = line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice line not found: %', line_id;
  END IF;
END;
$$;

-- close_dispute: Closes a dispute on an invoice line
CREATE OR REPLACE FUNCTION close_dispute(line_id UUID, note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invoice_lines
  SET dispute_status = 'closed',
      status = 'validated',
      validated_at = now(),
      notes = note,
      dispute_history = dispute_history || jsonb_build_object(
        'action', 'closed',
        'note', note,
        'timestamp', now()
      )
  WHERE id = line_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice line not found: %', line_id;
  END IF;
END;
$$;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at on all tables with that column
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ccm_invoice',
      'dcli_invoice',
      'dcli_invoice_line_item',
      'dcli_invoice_staging',
      'trac_invoice',
      'trac_invoice_staging',
      'invoices',
      'invoice_lines',
      'gps_uploads'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- ccm_invoice indexes
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_provider ON ccm_invoice(provider);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_status ON ccm_invoice(status);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_invoice_date ON ccm_invoice(invoice_date);

-- ccm_invoice_data indexes
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_data_invoice_id ON ccm_invoice_data(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ccm_invoice_data_sheet_name ON ccm_invoice_data(sheet_name);

-- dcli_invoice indexes
CREATE INDEX IF NOT EXISTS idx_dcli_invoice_invoice_id ON dcli_invoice(invoice_id);
CREATE INDEX IF NOT EXISTS idx_dcli_invoice_status ON dcli_invoice(status);

-- dcli_invoice_line_item indexes
CREATE INDEX IF NOT EXISTS idx_dcli_invoice_line_item_invoice_id ON dcli_invoice_line_item(invoice_id);

-- mg_tms indexes
CREATE INDEX IF NOT EXISTS idx_mg_tms_chassis_number ON mg_tms(LOWER(TRIM(chassis_number)));
CREATE INDEX IF NOT EXISTS idx_mg_tms_container_number ON mg_tms(LOWER(TRIM(container_number)));
CREATE INDEX IF NOT EXISTS idx_mg_tms_pickup_actual_date ON mg_tms(pickup_actual_date);

-- invoice_lines indexes
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_number ON invoice_lines(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_status ON invoice_lines(status);

-- gps_uploads indexes
CREATE INDEX IF NOT EXISTS idx_gps_uploads_provider ON gps_uploads(provider);
CREATE INDEX IF NOT EXISTS idx_gps_uploads_data_date ON gps_uploads(data_date);
CREATE INDEX IF NOT EXISTS idx_gps_uploads_status ON gps_uploads(status);

-- gps_data indexes
CREATE INDEX IF NOT EXISTS idx_gps_data_upload_id ON gps_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_gps_data_device_id ON gps_data(device_id);
CREATE INDEX IF NOT EXISTS idx_gps_data_recorded_at ON gps_data(recorded_at);

-- ============================================================================
-- ROW LEVEL SECURITY: Enable on all tables with permissive policies
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'ccm_invoice',
      'ccm_invoice_data',
      'ccm_activity',
      'dcli_invoice',
      'dcli_invoice_line_item',
      'dcli_invoice_staging',
      'dcli_activity',
      'trac_invoice',
      'trac_invoice_data',
      'trac_invoice_staging',
      'trac_activity',
      'trac_customer_information',
      'trac_debtor_transactions',
      'trac_invoice_lines',
      'trac_invoices',
      'trac_receipts',
      'flexivan-dispute',
      'flexivan-invoices',
      'flexivan-outstanding',
      'flexivan-payhistory',
      'flexivan_activity',
      'scspa_activity',
      'mg_tms',
      'invoices',
      'invoice_lines',
      'gps_uploads',
      'gps_data'
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
