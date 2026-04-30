-- Migration: Repoint mg_tms view to forrest_legacy.tms_data
-- Date: 2026-04-30
-- Purpose: forrest_legacy.tms_data is the canonical TMS dataset (237K rows, 2019-present)
--          replacing public.mg_data (42K rows, Oct 2025-present only).

DROP VIEW IF EXISTS public.v_warroom_chassis;
DROP VIEW IF EXISTS public.mg_tms;

CREATE VIEW public.mg_tms AS
SELECT
  t.ld_num,
  t.so_num,
  t.acct_mg_name,
  t.mbl,
  t.container_number,
  t.container_type,
  t.chassis_number,
  t.chassis_type,
  t.chassis_description,
  t.status,
  t.zero_rev,
  t.miles::numeric,
  t.weight::numeric,
  t.service,
  t.direct_nvo,
  t.load_complexity,
  t.customer_name,
  t.carrier_name,
  t.carrier_scac_code,
  t.pickup_loc_name,
  t.pickup_addr_1          AS pickup_loc_addr,
  t.pickup_city            AS pickup_loc_city,
  t.pickup_state           AS pickup_loc_state,
  t.pickup_zipcode         AS pickup_loc_zip,
  t.pickup_region,
  t.delivery_loc_name      AS drop_loc_name,
  t.delivery_addr_1        AS drop_loc_addr,
  t.delivery_city          AS drop_loc_city,
  t.delivery_state         AS drop_loc_state,
  t.delivery_zipcode       AS drop_loc_zip,
  t.delivery_region        AS drop_region,
  t.created_date           AS create_date,
  t.pickup_actual_date,
  t.delivery_actual_date   AS drop_actual_date,
  t.actual_rc_date,
  t.cust_rate_charge::numeric      AS customer_rate_amount,
  t.cust_invoice_charge::numeric   AS customer_inv_amount,
  t.carrier_rate_charge::numeric   AS carrier_rate_amount,
  t.carrier_invoice_charge::numeric AS carrier_inv_amount,
  t.cust_total_rate_fuel::numeric  AS linehaul_fuel_cust_rate,
  t.carrier_total_rate_fuel::numeric AS linehaul_fuel_carrier_rate,
  t.pod_status,
  t.pod_received,
  t.tendered_date,
  t.cycle_pickup_delivery::numeric,
  t.cycle_delivery_rc::numeric,
  t.customer_reference_number,
  t.transport_type,
  t.carrier_total_rate_detention::numeric,
  t.carrier_total_invoice_detention::numeric,
  t.cust_total_rate_detention::numeric,
  t.cust_total_invoice_detention::numeric
FROM forrest_legacy.tms_data t
WHERE t.ld_num IS NOT NULL;

CREATE VIEW public.v_warroom_chassis AS
SELECT
  loc.id                                             AS location_id,
  loc.name                                           AS location_name,
  loc.lat::float8                                    AS latitude,
  loc.lon::float8                                    AS longitude,
  loc.location_type,
  loc.city,
  loc.state,
  TRIM(m.chassis_number)                             AS chassis_number,
  m.chassis_type,
  m.status,
  m.customer_rate_amount                             AS cust_rate_charge,
  m.customer_inv_amount                              AS cust_invoice_charge,
  m.drop_actual_date                                 AS delivery_actual_date,
  m.actual_rc_date,
  m.ld_num,
  m.so_num,
  m.container_number,
  m.pickup_loc_name,
  m.drop_loc_name                                    AS delivery_loc_name,
  m.customer_name,
  CASE
    WHEN m.drop_actual_date IS NULL THEN NULL
    WHEN m.actual_rc_date IS NOT NULL THEN 0
    ELSE (CURRENT_DATE - m.drop_actual_date::date)
  END                                                AS dormant_days,
  CASE
    WHEN m.actual_rc_date IS NOT NULL                        THEN 'returned'
    WHEN m.drop_actual_date IS NULL                          THEN 'in_transit'
    WHEN (CURRENT_DATE - m.drop_actual_date::date) >= 3     THEN 'dormant_high'
    WHEN (CURRENT_DATE - m.drop_actual_date::date) >= 1     THEN 'dormant_low'
    ELSE 'active'
  END                                                AS war_room_status,
  CASE
    WHEN m.drop_actual_date IS NOT NULL
     AND m.actual_rc_date IS NULL
     AND (CURRENT_DATE - m.drop_actual_date::date) >= 3
     AND m.customer_rate_amount IS NOT NULL
     AND m.pickup_actual_date IS NOT NULL
     AND (m.drop_actual_date::date - m.pickup_actual_date::date) > 0
    THEN ROUND(
      (m.customer_rate_amount
        / NULLIF(m.drop_actual_date::date - m.pickup_actual_date::date, 0))
      * (CURRENT_DATE - m.drop_actual_date::date - 2),
      2)
    ELSE 0
  END                                                AS est_missed_revenue
FROM mg_locations loc
LEFT JOIN mg_tms m
  ON UPPER(TRIM(m.drop_loc_name)) = UPPER(TRIM(loc.name))
WHERE loc.lat IS NOT NULL
  AND loc.lon IS NOT NULL
  AND loc.active = true;

NOTIFY pgrst, 'reload schema';
