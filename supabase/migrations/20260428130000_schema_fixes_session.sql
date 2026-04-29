-- ============================================================
-- Schema fix session — 2026-04-28
-- ============================================================
-- Idempotent fixes applied in 6 transactions:
--   1. ytd_loads: resolve broken v1 PK (id → row_id)
--   2. mg_data: 3 numeric-bearing TEXT columns → numeric
--   3. ytd_loads: same 3 columns → numeric
--   4. dcli_activity: date_in / created_date TEXT → timestamptz
--   5. data_refresh_log: create table + seed row
--   6. PostgREST schema reload
-- ============================================================

-- ─────────────────────────────────────────
-- FIX 1 — ytd_loads PK conflict
-- Handles all 3 cases:
--   A. table missing                → create with v2 DDL
--   B. table exists, PK named "id"  → rename id → row_id
--   C. table exists, PK = row_id    → no-op
-- ─────────────────────────────────────────
BEGIN;

DO $$
DECLARE
  v_exists      boolean;
  v_has_row_id  boolean;
  v_has_id      boolean;
  v_pk_col      text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ytd_loads'
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- CASE A: create fresh with v2 DDL (row_id PK + bigint id data column)
    CREATE TABLE ytd_loads (
      row_id bigserial PRIMARY KEY,
      "id" bigint,
      "ld_num" text,
      "ld_num_format" text,
      "so_num" text,
      "so_num_format" text,
      "created_date" timestamptz,
      "created_by" text,
      "updated_date" timestamptz,
      "updated_by" text,
      "acct_mg_name" text,
      "mbl" text,
      "mbl_format" text,
      "container_number" text,
      "container_number_format" text,
      "container_type" text,
      "chassis_number" text,
      "chassis_number_format" text,
      "chassis_type" text,
      "chassis_description" text,
      "transport_type" text,
      "status" text,
      "zero_rev" text,
      "miles" numeric,
      "weight" numeric,
      "quantity" bigint,
      "quantity_type" text,
      "direct_nvo" text,
      "service" text,
      "load_complexity" text,
      "customer_name" text,
      "customer_reference_number" text,
      "entreprise_num" text,
      "carrier_name" text,
      "carrier_scac_code" text,
      "tendered_date" timestamptz,
      "pickup_loc_code" text,
      "pickup_loc_name" text,
      "pickup_addr_1" text,
      "pickup_addr_2" text,
      "pickup_city" text,
      "pickup_state" text,
      "pickup_zipcode" text,
      "pickup_region" text,
      "delivery_loc_code" text,
      "delivery_loc_name" text,
      "delivery_addr_1" text,
      "delivery_addr_2" text,
      "delivery_city" text,
      "delivery_state" text,
      "delivery_zipcode" text,
      "delivery_region" text,
      "pickup_appmt_start" timestamptz,
      "pickup_appmt_end" timestamptz,
      "pickup_actual_date" timestamptz,
      "delivery_appmt_start" timestamptz,
      "delivery_appmt_end" timestamptz,
      "delivery_actual_date" timestamptz,
      "delivery_create_date" timestamptz,
      "pod_received" text,
      "pod_added_date" timestamptz,
      "pod_status" text,
      "returned_empty_container_create_date" timestamptz,
      "actual_rc_date" timestamptz,
      "return_empty_container_update_date" timestamptz,
      "customer_invoice_requested_date" timestamptz,
      "cycle_create_tendered" bigint,
      "cycle_tendered_pickup" bigint,
      "cycle_pickup_delivery" bigint,
      "cycle_delivery_rc" bigint,
      "cycle_delivery_pod" bigint,
      "cycle_delivery_custinvreq" bigint,
      "future_actual_delivery" bigint,
      "future_pod_date" bigint,
      "future_rc_date" bigint,
      "future_custinvreqdate" bigint,
      "carrier_rate_charge" numeric,
      "carrier_total_rate_detention" numeric,
      "carrier_total_rate_fuel" numeric,
      "carrier_total_rate_linehaul" numeric,
      "carrier_total_invoice_detention" numeric,
      "carrier_total_invoice_fuel" numeric,
      "carrier_total_accessorials_rate" numeric,
      "carrier_invoice_charge" numeric,
      "carrier_invoice_num" text,
      "carrier_invoice_date" timestamptz,
      "cust_rate_charge" numeric,
      "cust_total_rate_detention" numeric,
      "cust_total_rate_fuel" numeric,
      "cust_total_rate_linehaul" numeric,
      "customer_total_accessorials_rate" numeric,
      "cust_invoice_charge" numeric,
      "cust_total_invoice_detention" numeric,
      "cust_total_invoice_fuel" numeric,
      "cust_total_invoice_linehaul" numeric,
      "customer_total_invoice_accessorials" numeric,
      "cust_invoice_num" text,
      "cust_invoice_date" timestamptz,
      "steamshipline" text,
      "shipmentid" text,
      "shipment_number" text,
      "shipment_reference_number" text,
      "vessel_name" text,
      "vessel_eta" text,
      "carrier_total_rate_other" numeric,
      "carrier_total_invoice_linehaul" numeric,
      "carrier_total_invoice_other" numeric,
      "cust_total_invoice_other" numeric,
      "masterbolkey" bigint,
      "syncentrydatetime" timestamptz,
      "source_file_key" bigint,
      "item_description" text,
      "dotnumber" bigint,
      "mcnumber" bigint,
      "servicemode" text,
      "unbilledflag" text,
      "dropandpull" text,
      "service_codes" text,
      "customer_account_number" text,
      "isemptyatyard" text,
      "isemptycontainerpickup" text,
      "ups_shipment_number" text,
      "last_free_date" text,
      "departed_rail_date" text,
      "available_at_port_date" timestamptz,
      "container_at_port" timestamptz,
      "empty_pickup_date" timestamptz,
      "sales_person" text,
      "origin_code_region" text,
      "domestic_move" text
    );
    RAISE NOTICE 'ytd_loads: created fresh (CASE A)';
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ytd_loads' AND column_name = 'row_id'
    ) INTO v_has_row_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ytd_loads' AND column_name = 'id'
    ) INTO v_has_id;

    SELECT kcu.column_name INTO v_pk_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema   = kcu.table_schema
    WHERE tc.table_schema   = 'public'
      AND tc.table_name     = 'ytd_loads'
      AND tc.constraint_type = 'PRIMARY KEY'
    LIMIT 1;

    IF v_has_row_id THEN
      -- CASE C: already fixed
      RAISE NOTICE 'ytd_loads: row_id already present (CASE C) — no change';
    ELSIF v_has_id AND v_pk_col = 'id' THEN
      -- CASE B: rename broken PK column id → row_id
      ALTER TABLE ytd_loads RENAME COLUMN id TO row_id;
      RAISE NOTICE 'ytd_loads: renamed id → row_id (CASE B)';
    ELSE
      RAISE EXCEPTION
        'ytd_loads exists in unexpected state: has_row_id=%, has_id=%, pk_col=%',
        v_has_row_id, v_has_id, v_pk_col;
    END IF;
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────
-- FIX 2 — mg_data: 3 TEXT → numeric
-- Guarded so re-running is safe.
-- ─────────────────────────────────────────
BEGIN;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='mg_data'
         AND column_name='carrier_total_rate_other') = 'text' THEN
    ALTER TABLE mg_data
      ALTER COLUMN "carrier_total_rate_other"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_rate_other"), '')::numeric;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='mg_data'
         AND column_name='carrier_total_invoice_linehaul') = 'text' THEN
    ALTER TABLE mg_data
      ALTER COLUMN "carrier_total_invoice_linehaul"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_invoice_linehaul"), '')::numeric;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='mg_data'
         AND column_name='carrier_total_invoice_other') = 'text' THEN
    ALTER TABLE mg_data
      ALTER COLUMN "carrier_total_invoice_other"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_invoice_other"), '')::numeric;
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────
-- FIX 3 — ytd_loads: same 3 TEXT → numeric
-- ─────────────────────────────────────────
BEGIN;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ytd_loads'
         AND column_name='carrier_total_rate_other') = 'text' THEN
    ALTER TABLE ytd_loads
      ALTER COLUMN "carrier_total_rate_other"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_rate_other"), '')::numeric;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ytd_loads'
         AND column_name='carrier_total_invoice_linehaul') = 'text' THEN
    ALTER TABLE ytd_loads
      ALTER COLUMN "carrier_total_invoice_linehaul"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_invoice_linehaul"), '')::numeric;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ytd_loads'
         AND column_name='carrier_total_invoice_other') = 'text' THEN
    ALTER TABLE ytd_loads
      ALTER COLUMN "carrier_total_invoice_other"
        TYPE numeric
        USING NULLIF(TRIM("carrier_total_invoice_other"), '')::numeric;
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────
-- FIX 4 — dcli_activity: TEXT → timestamptz
-- Format observed: 'MM/DD/YYYY HH:MM' with possible trailing space.
-- ─────────────────────────────────────────
BEGIN;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='dcli_activity'
         AND column_name='date_in') = 'text' THEN
    ALTER TABLE dcli_activity
      ALTER COLUMN "date_in"
        TYPE timestamptz
        USING CASE
          WHEN NULLIF(TRIM("date_in"), '') IS NULL THEN NULL
          ELSE TO_TIMESTAMP(TRIM("date_in"), 'MM/DD/YYYY HH24:MI')
        END;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='dcli_activity'
         AND column_name='created_date') = 'text' THEN
    ALTER TABLE dcli_activity
      ALTER COLUMN "created_date"
        TYPE timestamptz
        USING CASE
          WHEN NULLIF(TRIM("created_date"), '') IS NULL THEN NULL
          ELSE TO_TIMESTAMP(TRIM("created_date"), 'MM/DD/YYYY HH24:MI')
        END;
  END IF;
END $$;

COMMIT;

-- ─────────────────────────────────────────
-- FIX 5 — data_refresh_log: create + seed
-- ─────────────────────────────────────────
BEGIN;

CREATE TABLE IF NOT EXISTS data_refresh_log (
  id          bigserial PRIMARY KEY,
  table_name  text        NOT NULL,
  source_file text,
  row_count   bigint,
  loaded_at   timestamptz NOT NULL DEFAULT NOW(),
  loaded_by   text        DEFAULT 'system',
  notes       text
);

INSERT INTO data_refresh_log (table_name, notes)
SELECT 'system', 'data_refresh_log table created — schema fix session'
WHERE NOT EXISTS (
  SELECT 1 FROM data_refresh_log
  WHERE table_name = 'system'
    AND notes = 'data_refresh_log table created — schema fix session'
);

COMMIT;

-- ─────────────────────────────────────────
-- FIX 6 — PostgREST schema cache reload
-- ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
