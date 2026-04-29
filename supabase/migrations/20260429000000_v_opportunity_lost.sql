-- Opportunity Lost analytics: dormant MCL chassis & daily revenue lost
-- Replaces the manual Excel report.

CREATE OR REPLACE VIEW v_opportunity_lost AS
SELECT
  cu.chassis_number,
  cu.chassis_type,
  cu.lessor,
  cu.region,
  mc.reporting_category,
  ROUND(cu.days_idle::numeric, 0)::integer AS days_idle,
  cu.idle_lease_cost,
  cu.lease_rate_per_day,
  cu.last_activity_date,
  cu.utilization_status,
  m.acct_mgr_name,
  m.container_number,
  m.ld_num
FROM v_chassis_utilization cu
JOIN mcl_chassis mc ON TRIM(cu.chassis_number) = TRIM(mc.chassis_number)
LEFT JOIN LATERAL (
  SELECT acct_mgr_name, container_number, ld_num
  FROM mg_data
  WHERE TRIM(chassis_number) = TRIM(cu.chassis_number)
  ORDER BY updated_at DESC
  LIMIT 1
) m ON true
WHERE cu.utilization_status IN ('DORMANT', 'IDLE')
  AND mc.chassis_status = 'ACTIVE';

CREATE OR REPLACE FUNCTION get_dormant_trend()
RETURNS TABLE(report_date date, dormant_count bigint, daily_opportunity_cost numeric)
LANGUAGE sql STABLE AS $$
  SELECT
    (CURRENT_DATE - s.day)::date AS report_date,
    COUNT(*)::bigint AS dormant_count,
    COALESCE(SUM(cu.lease_rate_per_day), 0) AS daily_opportunity_cost
  FROM v_chassis_utilization cu
  JOIN mcl_chassis mc ON TRIM(cu.chassis_number) = TRIM(mc.chassis_number)
  CROSS JOIN generate_series(0, 29) AS s(day)
  WHERE mc.chassis_status = 'ACTIVE'
    AND cu.last_activity_date <= (CURRENT_DATE - s.day)
    AND cu.lease_rate_per_day IS NOT NULL
  GROUP BY s.day
  ORDER BY report_date ASC;
$$;

NOTIFY pgrst, 'reload schema';
