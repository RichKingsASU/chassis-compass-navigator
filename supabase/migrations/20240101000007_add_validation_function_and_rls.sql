-- ============================================================================
-- Migration: Add run_full_chassis_validation RPC + production RLS policies
-- Description: Creates the run_full_chassis_validation() function that
--   cross-validates vendor invoices against TMS data, storing results in
--   validation_results. Also tightens RLS policies for production.
-- ============================================================================

-- ─────────────────────────────────────────
-- FUNCTION: run_full_chassis_validation
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION run_full_chassis_validation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
  v_tms RECORD;
  v_match_type TEXT;
  v_tms_amount NUMERIC;
  v_variance NUMERIC;
  v_status TEXT;
BEGIN
  DELETE FROM validation_results;

  -- DCLI
  FOR v_inv IN
    SELECT
      li.chassis          AS chassis_number,
      'DCLI'              AS vendor,
      di.invoice_number   AS invoice_number,
      li.line_total       AS invoice_amount
    FROM dcli_invoice_line_item li
    JOIN dcli_invoice di ON di.id = li.invoice_id
    WHERE li.chassis IS NOT NULL
  LOOP
    v_match_type := 'none';
    v_tms_amount := NULL;

    SELECT mt.cust_rate_charge INTO v_tms_amount
    FROM (
      SELECT COALESCE((raw_data->>'cust_rate_charge')::numeric, 0) AS cust_rate_charge,
             chassis_number
      FROM mg_tms
    ) mt
    WHERE LOWER(TRIM(mt.chassis_number)) = LOWER(TRIM(v_inv.chassis_number))
    LIMIT 1;

    IF v_tms_amount IS NOT NULL THEN
      v_match_type := 'exact';
    ELSE
      SELECT 0 INTO v_tms_amount
      FROM portpro_tms
      WHERE LOWER(TRIM(chassis_number)) = LOWER(TRIM(v_inv.chassis_number))
      LIMIT 1;
      IF FOUND THEN
        v_match_type := 'partial';
        v_tms_amount := 0;
      END IF;
    END IF;

    v_variance := COALESCE(v_inv.invoice_amount, 0) - COALESCE(v_tms_amount, 0);
    v_status := CASE
      WHEN v_match_type = 'exact' AND ABS(v_variance) < 0.01 THEN 'validated'
      WHEN v_match_type = 'exact' THEN 'variance'
      WHEN v_match_type = 'partial' THEN 'partial_match'
      ELSE 'unmatched'
    END;

    INSERT INTO validation_results (chassis_number, vendor, invoice_number, invoice_amount, tms_amount, variance, match_type, status)
    VALUES (v_inv.chassis_number, v_inv.vendor, v_inv.invoice_number, v_inv.invoice_amount, v_tms_amount, v_variance, v_match_type, v_status);
  END LOOP;

  -- CCM
  FOR v_inv IN
    SELECT
      cd.row_data->>'chassis_number' AS chassis_number,
      'CCM'                          AS vendor,
      ci.invoice_number              AS invoice_number,
      (cd.row_data->>'amount')::numeric AS invoice_amount
    FROM ccm_invoice_data cd
    JOIN ccm_invoice ci ON ci.id = cd.invoice_id
    WHERE cd.row_data->>'chassis_number' IS NOT NULL
  LOOP
    v_match_type := 'none';
    v_tms_amount := NULL;

    SELECT 0 INTO v_tms_amount
    FROM mg_tms
    WHERE LOWER(TRIM(chassis_number)) = LOWER(TRIM(v_inv.chassis_number))
    LIMIT 1;

    IF FOUND THEN v_match_type := 'exact'; v_tms_amount := 0; END IF;

    v_variance := COALESCE(v_inv.invoice_amount, 0) - COALESCE(v_tms_amount, 0);
    v_status := CASE WHEN v_match_type = 'exact' THEN 'validated' ELSE 'unmatched' END;

    INSERT INTO validation_results (chassis_number, vendor, invoice_number, invoice_amount, tms_amount, variance, match_type, status)
    VALUES (v_inv.chassis_number, v_inv.vendor, v_inv.invoice_number, v_inv.invoice_amount, v_tms_amount, v_variance, v_match_type, v_status);
  END LOOP;

  -- TRAC
  FOR v_inv IN
    SELECT
      td.row_data->>'chassis_number' AS chassis_number,
      'TRAC'                         AS vendor,
      ti.invoice_number              AS invoice_number,
      (td.row_data->>'amount')::numeric AS invoice_amount
    FROM trac_invoice_data td
    JOIN trac_invoice ti ON ti.id = td.invoice_id
    WHERE td.row_data->>'chassis_number' IS NOT NULL
  LOOP
    v_match_type := 'none';
    v_tms_amount := NULL;

    SELECT 0 INTO v_tms_amount
    FROM mg_tms
    WHERE LOWER(TRIM(chassis_number)) = LOWER(TRIM(v_inv.chassis_number))
    LIMIT 1;

    IF FOUND THEN v_match_type := 'exact'; v_tms_amount := 0; END IF;

    v_variance := COALESCE(v_inv.invoice_amount, 0) - COALESCE(v_tms_amount, 0);
    v_status := CASE WHEN v_match_type = 'exact' THEN 'validated' ELSE 'unmatched' END;

    INSERT INTO validation_results (chassis_number, vendor, invoice_number, invoice_amount, tms_amount, variance, match_type, status)
    VALUES (v_inv.chassis_number, v_inv.vendor, v_inv.invoice_number, v_inv.invoice_amount, v_tms_amount, v_variance, v_match_type, v_status);
  END LOOP;

  -- WCCP
  FOR v_inv IN
    SELECT
      wd.row_data->>'chassis_number' AS chassis_number,
      'WCCP'                         AS vendor,
      wi.invoice_number              AS invoice_number,
      (wd.row_data->>'amount')::numeric AS invoice_amount
    FROM wccp_invoice_data wd
    JOIN wccp_invoice wi ON wi.id = wd.invoice_id
    WHERE wd.row_data->>'chassis_number' IS NOT NULL
  LOOP
    v_match_type := 'none';
    v_tms_amount := NULL;

    SELECT 0 INTO v_tms_amount
    FROM mg_tms
    WHERE LOWER(TRIM(chassis_number)) = LOWER(TRIM(v_inv.chassis_number))
    LIMIT 1;

    IF FOUND THEN v_match_type := 'exact'; v_tms_amount := 0; END IF;

    v_variance := COALESCE(v_inv.invoice_amount, 0) - COALESCE(v_tms_amount, 0);
    v_status := CASE WHEN v_match_type = 'exact' THEN 'validated' ELSE 'unmatched' END;

    INSERT INTO validation_results (chassis_number, vendor, invoice_number, invoice_amount, tms_amount, variance, match_type, status)
    VALUES (v_inv.chassis_number, v_inv.vendor, v_inv.invoice_number, v_inv.invoice_amount, v_tms_amount, v_variance, v_match_type, v_status);
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- PRODUCTION RLS POLICIES
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
      'wccp_invoice', 'wccp_invoice_data', 'wccp_activity',
      'scspa_invoice', 'scspa_invoice_data',
      'app_settings'
    ])
  LOOP
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = tbl AND table_schema = 'public'
    );

    EXECUTE format('DROP POLICY IF EXISTS "Allow all access" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated write" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated update" ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated delete" ON %I;', tbl);

    EXECUTE format('CREATE POLICY "Authenticated read" ON %I FOR SELECT TO authenticated USING (true);', tbl);
    EXECUTE format('CREATE POLICY "Authenticated write" ON %I FOR INSERT TO authenticated WITH CHECK (true);', tbl);
    EXECUTE format('CREATE POLICY "Authenticated update" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true);', tbl);
    EXECUTE format('CREATE POLICY "Authenticated delete" ON %I FOR DELETE TO authenticated USING (true);', tbl);
  END LOOP;
END;
$$;