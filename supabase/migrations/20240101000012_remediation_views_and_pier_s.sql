-- ─────────────────────────────────────────────────────────────
-- Remediation: Pier S events, billing exposure, unbilled loads,
-- and unified chassis status view.
--
-- NOTE on deviations from original spec:
--   * mg_tms is a VIEW over mg_data; ALTER TABLE / ADD COLUMN is
--     not applicable. The "isemptyatyard" and "delivery_actual_date
--     cast-to-float" remediations from the spec target a different
--     shape than what exists in this repo.
--   * dcli_activity here has columns (chassis, date_in, date_out,
--     days_out, pool_contract, reservation_number, pick_up_location,
--     location_in, market, asset_type, motor_carrier_scac) — NOT
--     the invoices shape from migration 000001.
--   * samsara_gps has (chassis_number, latitude, longitude,
--     timestamp, location_name, speed, status) — NOT asset_id.
-- ─────────────────────────────────────────────────────────────

-- ============================================================
-- 1. Pier S gate events staging + typed tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pier_s_events_staging (
  id                bigserial PRIMARY KEY,
  "Terminal"        text,
  "EventDate"       text,
  "EventTime"       text,
  "ChassisNo"       text,
  "ChassisOwner"    text,
  "ContainerNo"     text,
  "ContainerOwner"  text,
  "EventDescription" text,
  "LicensePlate"    text,
  "BookingNo"       text,
  "Condition"       text,
  _source_file      text,
  _load_ts          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pier_s_events (
  id                bigserial PRIMARY KEY,
  "Terminal"        text,
  "EventDate"       date,
  "EventTime"       text,
  "ChassisNo"       text,
  "ChassisOwner"    text,
  "ContainerNo"     text,
  "ContainerOwner"  text,
  "EventDescription" text,
  "LicensePlate"    text,
  "BookingNo"       text,
  "Condition"       text,
  _source_file      text,
  _load_ts          timestamptz DEFAULT now(),
  CONSTRAINT uq_pier_s_events UNIQUE ("ChassisNo", "EventDate", "EventTime", "EventDescription")
);

CREATE INDEX IF NOT EXISTS idx_pier_s_events_chassis ON public.pier_s_events ("ChassisNo");
CREATE INDEX IF NOT EXISTS idx_pier_s_events_date    ON public.pier_s_events ("EventDate");

ALTER TABLE public.pier_s_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pier_s_events_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pier_s_events public read"         ON public.pier_s_events;
CREATE POLICY "pier_s_events public read" ON public.pier_s_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pier_s_events_staging public read" ON public.pier_s_events_staging;
CREATE POLICY "pier_s_events_staging public read" ON public.pier_s_events_staging
  FOR SELECT USING (true);

-- ============================================================
-- 2. v_billing_exposure — DCLI per-diem accrual tracker
-- ============================================================
CREATE OR REPLACE VIEW public.v_billing_exposure AS
WITH base AS (
  SELECT
    TRIM(chassis)          AS chassis_number,
    reservation_number,
    pick_up_location,
    location_in,
    date_out,
    date_in,
    days_out               AS vendor_billed_days,
    pool_contract,
    motor_carrier_scac,
    market,
    asset_type,
    CASE
      WHEN date_in IS NULL
        THEN FLOOR(EXTRACT(EPOCH FROM (now() - date_out::timestamptz)) / 86400)::int
      ELSE FLOOR(EXTRACT(EPOCH FROM (date_in::timestamptz - date_out::timestamptz)) / 86400)::int
    END AS computed_days,
    (date_in IS NULL) AS is_open
  FROM public.dcli_activity
  WHERE chassis IS NOT NULL
    AND TRIM(chassis) <> ''
    AND date_out IS NOT NULL
)
SELECT
  chassis_number,
  reservation_number,
  pick_up_location,
  location_in,
  date_out,
  date_in,
  vendor_billed_days,
  computed_days,
  (vendor_billed_days - computed_days) AS days_delta,
  pool_contract,
  motor_carrier_scac,
  market,
  asset_type,
  is_open,
  CASE WHEN is_open THEN computed_days ELSE NULL END AS days_accruing
FROM base;

-- ============================================================
-- 3. v_unbilled_loads — loads with rate but no invoice
--    (mg_data has zero_rev, no unbilledflag)
-- ============================================================
CREATE OR REPLACE VIEW public.v_unbilled_loads AS
SELECT
  id                                                AS row_id,
  ld_num,
  so_num,
  createdate                                        AS created_date,
  owner                                             AS customer_name,
  TRIM(chassis_number)                              AS chassis_number,
  container_number,
  status,
  pickup_loc_name,
  drop_loc_name                                     AS delivery_loc_name,
  pickup_actual_date,
  drop_actual_date                                  AS delivery_actual_date,
  actual_rc_date,
  NULLIF(customer_rate_amount, '')::numeric         AS cust_rate_charge,
  NULLIF(customer_inv_amount, '')::numeric          AS cust_invoice_charge,
  NULLIF(carrier_rate_amount, '')::numeric          AS carrier_rate_charge,
  NULLIF(carrier_inv_amount, '')::numeric           AS carrier_invoice_charge,
  zero_rev                                          AS unbilledflag,
  steamshipline,
  mbl,
  CASE
    WHEN drop_actual_date ~ '^\d{4}-\d{2}-\d{2}'
      THEN FLOOR(EXTRACT(EPOCH FROM (now() - drop_actual_date::timestamptz)) / 86400)::int
    ELSE NULL
  END AS days_since_delivery
FROM public.mg_data
WHERE
  (status IS NULL OR UPPER(status) NOT IN ('CANCELLED', 'VOID'))
  AND COALESCE(UPPER(TRIM(zero_rev)), '') <> 'Y'
  AND COALESCE(NULLIF(customer_rate_amount, '')::numeric, 0) > 0
  AND COALESCE(NULLIF(customer_inv_amount, '')::numeric, 0) = 0;

-- ============================================================
-- 4. v_chassis_status — unified status across TMS, DCLI, Pier S, GPS
-- ============================================================
CREATE OR REPLACE VIEW public.v_chassis_status AS
WITH tms_latest AS (
  SELECT DISTINCT ON (TRIM(chassis_number))
    TRIM(chassis_number)                             AS chassis_number,
    ld_num,
    status                                           AS tms_status,
    owner                                            AS customer_name,
    pickup_loc_name,
    drop_loc_name                                    AS delivery_loc_name,
    pickup_actual_date,
    drop_actual_date                                 AS delivery_actual_date,
    actual_rc_date,
    NULLIF(customer_rate_amount, '')::numeric        AS cust_rate_charge,
    NULLIF(customer_inv_amount, '')::numeric         AS cust_invoice_charge,
    zero_rev                                         AS unbilledflag,
    createdate                                       AS tms_created_date
  FROM public.mg_data
  WHERE chassis_number IS NOT NULL AND TRIM(chassis_number) <> ''
  ORDER BY TRIM(chassis_number), createdate DESC NULLS LAST
),
dcli_latest AS (
  SELECT DISTINCT ON (TRIM(chassis))
    TRIM(chassis)          AS chassis_number,
    reservation_number     AS dcli_reservation,
    pick_up_location       AS dcli_pickup,
    location_in            AS dcli_location_in,
    date_out               AS dcli_date_out,
    date_in                AS dcli_date_in,
    days_out               AS dcli_vendor_days,
    CASE
      WHEN date_in IS NULL
        THEN FLOOR(EXTRACT(EPOCH FROM (now() - date_out::timestamptz)) / 86400)::int
      ELSE FLOOR(EXTRACT(EPOCH FROM (date_in::timestamptz - date_out::timestamptz)) / 86400)::int
    END AS dcli_computed_days,
    pool_contract
  FROM public.dcli_activity
  WHERE chassis IS NOT NULL AND TRIM(chassis) <> '' AND date_out IS NOT NULL
  ORDER BY TRIM(chassis), date_out DESC NULLS LAST
),
pier_latest AS (
  SELECT DISTINCT ON ("ChassisNo")
    "ChassisNo"        AS chassis_number,
    "Terminal"         AS last_terminal,
    "EventDate"        AS last_gate_date,
    "EventDescription" AS last_gate_event,
    "ContainerNo"      AS last_container
  FROM public.pier_s_events
  WHERE "ChassisNo" IS NOT NULL
  ORDER BY "ChassisNo", "EventDate" DESC NULLS LAST, "EventTime" DESC NULLS LAST
),
gps_latest AS (
  SELECT DISTINCT ON (chassis_number)
    chassis_number,
    location_name   AS gps_location,
    "timestamp"     AS gps_last_seen,
    latitude        AS gps_lat,
    longitude       AS gps_lng
  FROM public.samsara_gps
  WHERE chassis_number IS NOT NULL
  ORDER BY chassis_number, "timestamp" DESC NULLS LAST
)
SELECT
  COALESCE(t.chassis_number, d.chassis_number, p.chassis_number) AS chassis_number,
  CASE
    WHEN d.dcli_date_in IS NULL AND d.dcli_date_out IS NOT NULL     THEN 'OPEN - DCLI Active'
    WHEN t.tms_status IN ('Active','Dispatched','In Transit')        THEN 'ON LOAD'
    WHEN t.tms_status = 'Delivered' AND d.dcli_date_in IS NULL       THEN 'DELIVERED - NOT RETURNED'
    WHEN t.tms_status = 'Delivered' AND d.dcli_date_in IS NOT NULL   THEN 'RETURNED'
    WHEN t.actual_rc_date IS NOT NULL                                THEN 'RETURNED'
    ELSE COALESCE(t.tms_status, 'UNKNOWN')
  END AS operational_status,
  CASE
    WHEN d.dcli_date_in IS NULL AND d.dcli_date_out IS NOT NULL
      THEN FLOOR(EXTRACT(EPOCH FROM (now() - d.dcli_date_out::timestamptz)) / 86400)::int
    ELSE NULL
  END AS accruing_days,
  CASE
    WHEN d.dcli_vendor_days IS NOT NULL AND d.dcli_computed_days IS NOT NULL
      THEN (d.dcli_vendor_days - d.dcli_computed_days)
    ELSE NULL
  END AS billed_vs_computed_days_delta,
  t.ld_num,
  t.tms_status,
  t.customer_name,
  t.pickup_loc_name,
  t.delivery_loc_name,
  t.delivery_actual_date,
  t.actual_rc_date,
  t.cust_rate_charge,
  t.cust_invoice_charge,
  t.unbilledflag,
  t.tms_created_date,
  d.dcli_reservation,
  d.dcli_pickup,
  d.dcli_location_in,
  d.dcli_date_out,
  d.dcli_date_in,
  d.dcli_vendor_days,
  d.dcli_computed_days,
  d.pool_contract,
  p.last_terminal,
  p.last_gate_date,
  p.last_gate_event,
  p.last_container,
  g.gps_location,
  g.gps_last_seen,
  g.gps_lat,
  g.gps_lng,
  CASE WHEN g.gps_last_seen < (now() - INTERVAL '48 hours') THEN true ELSE false END AS gps_stale
FROM tms_latest  t
FULL OUTER JOIN dcli_latest d ON t.chassis_number = d.chassis_number
FULL OUTER JOIN pier_latest p ON COALESCE(t.chassis_number, d.chassis_number) = p.chassis_number
LEFT JOIN gps_latest g         ON COALESCE(t.chassis_number, d.chassis_number, p.chassis_number) = g.chassis_number;
