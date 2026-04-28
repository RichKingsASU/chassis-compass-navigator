CREATE OR REPLACE VIEW v_chassis_gps_mcl AS
SELECT g.*
FROM v_chassis_gps_unified g
INNER JOIN mcl_chassis m ON TRIM(g.chassis_number) = TRIM(m.chassis_number);
