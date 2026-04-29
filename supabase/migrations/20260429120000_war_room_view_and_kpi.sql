-- War Room: chassis location view + KPI summary function
-- Joins canonical_dataset (location coords) with mg_data (TMS).
-- chassis_number values in mg_data contain spaces; TRIM applied on the join.

CREATE OR REPLACE VIEW v_warroom_chassis AS
SELECT
  cd."CanonicalID",
  cd."Name"                                          AS location_name,
  cd."Latitude"                                      AS latitude,
  cd."Longitude"                                     AS longitude,
  cd."LocationType"                                  AS location_type,
  cd."City"                                          AS city,
  cd."State/Province"                                AS state,
  TRIM(m.chassis_number)                             AS chassis_number,
  m.chassis_type,
  m.status,
  m.customer_name,
  m.cust_rate_charge,
  m.carrier_rate_charge,
  m.delivery_actual_date,
  m.actual_rc_date,
  m.ld_num,
  m.so_num,
  m.container_number,
  m.pickup_loc_name,
  m.delivery_loc_name,
  CASE
    WHEN m.delivery_actual_date IS NULL THEN NULL
    WHEN m.actual_rc_date IS NOT NULL THEN 0
    ELSE (CURRENT_DATE - m.delivery_actual_date::date)
  END                                                AS dormant_days,
  CASE
    WHEN m.actual_rc_date IS NOT NULL                THEN 'returned'
    WHEN m.delivery_actual_date IS NULL              THEN 'in_transit'
    WHEN (CURRENT_DATE - m.delivery_actual_date::date) >= 3 THEN 'dormant_high'
    WHEN (CURRENT_DATE - m.delivery_actual_date::date) >= 1 THEN 'dormant_low'
    ELSE 'active'
  END                                                AS war_room_status,
  CASE
    WHEN (CURRENT_DATE - m.delivery_actual_date::date) >= 3
     AND m.actual_rc_date IS NULL
     AND m.cust_rate_charge IS NOT NULL
    THEN ROUND(
      (m.cust_rate_charge / NULLIF(m.cycle_pickup_delivery, 0))
      * (CURRENT_DATE - m.delivery_actual_date::date - 2),
      2)
    ELSE 0
  END                                                AS est_missed_revenue
FROM canonical_dataset cd
LEFT JOIN mg_data m
  ON TRIM(m.chassis_number) = cd."SourceID"
WHERE cd."Latitude" IS NOT NULL
  AND cd."Longitude" IS NOT NULL
  AND cd."ActiveFlag" = 'Active';

CREATE OR REPLACE FUNCTION fn_warroom_kpi()
RETURNS TABLE (
  total_locations      bigint,
  active_count         bigint,
  dormant_low_count    bigint,
  dormant_high_count   bigint,
  in_transit_count     bigint,
  returned_count       bigint,
  total_missed_revenue numeric
)
LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)                                                        AS total_locations,
    COUNT(*) FILTER (WHERE war_room_status = 'active')             AS active_count,
    COUNT(*) FILTER (WHERE war_room_status = 'dormant_low')        AS dormant_low_count,
    COUNT(*) FILTER (WHERE war_room_status = 'dormant_high')       AS dormant_high_count,
    COUNT(*) FILTER (WHERE war_room_status = 'in_transit')         AS in_transit_count,
    COUNT(*) FILTER (WHERE war_room_status = 'returned')           AS returned_count,
    COALESCE(SUM(est_missed_revenue), 0)                           AS total_missed_revenue
  FROM v_warroom_chassis;
$$;

NOTIFY pgrst, 'reload schema';
