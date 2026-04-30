CREATE OR REPLACE VIEW v_warroom_chassis AS
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
        / (m.drop_actual_date::date - m.pickup_actual_date::date))
      * (CURRENT_DATE - m.drop_actual_date::date - 2),
      2)
    ELSE 0
  END                                                AS est_missed_revenue
FROM mg_locations loc
LEFT JOIN mg_data m
  ON UPPER(TRIM(m.drop_loc_name)) = UPPER(TRIM(loc.name))
WHERE loc.lat IS NOT NULL
  AND loc.lon IS NOT NULL
  AND loc.active = true;

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
    COUNT(*)                                                       AS total_locations,
    COUNT(*) FILTER (WHERE war_room_status = 'active')            AS active_count,
    COUNT(*) FILTER (WHERE war_room_status = 'dormant_low')       AS dormant_low_count,
    COUNT(*) FILTER (WHERE war_room_status = 'dormant_high')      AS dormant_high_count,
    COUNT(*) FILTER (WHERE war_room_status = 'in_transit')        AS in_transit_count,
    COUNT(*) FILTER (WHERE war_room_status = 'returned')          AS returned_count,
    COALESCE(SUM(est_missed_revenue), 0)                          AS total_missed_revenue
  FROM v_warroom_chassis;
$$;

NOTIFY pgrst, 'reload schema';
