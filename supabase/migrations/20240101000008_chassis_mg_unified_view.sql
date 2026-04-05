-- ============================================================================
-- Migration: Create chassis_mg_unified view
-- Description: Unified chassis intelligence layer joining chassis + mg_data
--              by chassis_number.
-- ============================================================================
-- Run: npx supabase db push  — from local terminal to apply this migration
-- The chassis_mg_unified view requires the chassis table to exist with a chassis_number column
-- If chassis table does not yet exist, this view will fail — run chassis table migration first
-- ============================================================================

-- ─────────────────────────────────────────
-- Add missing columns to chassis table
-- ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chassis' AND column_name = 'chassis_description') THEN
    ALTER TABLE chassis ADD COLUMN chassis_description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chassis' AND column_name = 'status') THEN
    ALTER TABLE chassis ADD COLUMN status text DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chassis' AND column_name = 'lessor') THEN
    ALTER TABLE chassis ADD COLUMN lessor text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chassis' AND column_name = 'notes') THEN
    ALTER TABLE chassis ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chassis' AND column_name = 'updated_at') THEN
    ALTER TABLE chassis ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Backfill chassis_description from chassis_desc if it exists
UPDATE chassis SET chassis_description = chassis_desc
WHERE chassis_description IS NULL AND chassis_desc IS NOT NULL;

-- ─────────────────────────────────────────
-- VIEW: chassis_mg_unified
-- ─────────────────────────────────────────
-- Joins chassis to mg_data (MercuryGate TMS data).
-- mg_data columns are mostly TEXT — financial fields are cast to numeric.
-- dcli_activity has no chassis column so is omitted.
-- yard_events_data does not exist on remote so is omitted.
-- ─────────────────────────────────────────
CREATE OR REPLACE VIEW chassis_mg_unified AS
SELECT
  c.id                        AS chassis_id,
  c.chassis_number,
  c.chassis_type,
  c.chassis_description,
  c.status                    AS chassis_status,
  c.lessor,
  c.notes,
  c.updated_at                AS chassis_updated_at,

  -- Most recent MG load
  mg.ld_num                   AS latest_ld_num,
  mg.so_num                   AS latest_so_num,
  mg.status                   AS latest_load_status,
  mg.owner                    AS customer_name,
  mg.acct_mgr_name,
  mg.carrier_name,
  mg.carrier_scac,
  mg.pickup_loc_name,
  mg.pickup_loc_city,
  mg.pickup_loc_stateprovince AS pickup_state,
  mg.pickup_actual_date,
  mg.drop_loc_name            AS delivery_loc_name,
  mg.drop_loc_city            AS delivery_city,
  mg.drop_loc_stateprovince   AS delivery_state,
  mg.drop_actual_date         AS delivery_actual_date,
  mg.actual_rc_date,
  mg.container_number,
  mg.container_description    AS container_type,
  mg.mbl,
  mg.steamshipline,
  mg.service_description      AS service,
  mg.miles,
  NULLIF(mg.customer_rate_amount, '')::numeric   AS cust_rate_charge,
  NULLIF(mg.customer_inv_amount, '')::numeric    AS cust_invoice_charge,
  NULLIF(mg.carrier_rate_amount, '')::numeric    AS carrier_rate_charge,
  NULLIF(mg.carrier_inv_amount, '')::numeric     AS carrier_invoice_charge,
  NULLIF(mg.margin_rate, '')::numeric            AS margin_rate,
  mg.createdate               AS load_created_date,

  -- Aggregates from mg_data
  mg_stats.total_loads,
  mg_stats.total_revenue,
  mg_stats.first_load_date,
  mg_stats.last_load_date

FROM chassis c

-- Latest MG load (LATERAL join for most recent)
LEFT JOIN LATERAL (
  SELECT * FROM mg_data
  WHERE TRIM(chassis_number) = TRIM(c.chassis_number)
  ORDER BY createdate DESC NULLS LAST
  LIMIT 1
) mg ON true

-- Aggregate stats across all MG loads
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int                                      AS total_loads,
    SUM(NULLIF(customer_rate_amount, '')::numeric)     AS total_revenue,
    MIN(createdate)                                    AS first_load_date,
    MAX(createdate)                                    AS last_load_date
  FROM mg_data
  WHERE TRIM(chassis_number) = TRIM(c.chassis_number)
) mg_stats ON true;

-- ─────────────────────────────────────────
-- RLS / ownership
-- ─────────────────────────────────────────
ALTER VIEW chassis_mg_unified OWNER TO postgres;
GRANT SELECT ON chassis_mg_unified TO anon, authenticated;
