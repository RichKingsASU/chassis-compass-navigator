CREATE OR REPLACE VIEW v_chassis_gps_mcl AS
SELECT
  g.*,
  cm.lessor,
  cm.chassis_reporting_category AS reporting_category,
  cm.current_rate_per_day        AS lease_rate_per_day
FROM v_chassis_gps_unified g
INNER JOIN mcl_chassis m   ON TRIM(g.chassis_number) = TRIM(m.chassis_number)
LEFT  JOIN chassis_master cm ON TRIM(g.chassis_number) = TRIM(cm.chassis_number);
