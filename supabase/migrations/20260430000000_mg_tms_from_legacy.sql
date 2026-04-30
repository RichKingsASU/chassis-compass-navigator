-- ============================================================
-- Migration: Repoint mg_tms view to forrest_legacy.tms_data
-- Date: 2026-04-30
--
-- Purpose:
--   The canonical TMS dataset has moved from public.mg_data to the
--   forrest_legacy schema (forrest_legacy.tms_data). Update the
--   app-facing mg_tms view to read from the new source while keeping
--   the existing column contract (so callers — DCLI matcher,
--   War Room view, KPI rail, etc. — keep working unchanged).
--
-- Notes:
--   - chassis_master LEFT JOIN is preserved on TRIM(chassis_number).
--   - Column list mirrors the previous mg_tms definition in
--     20240101000014_mg_data.sql.
-- ============================================================

DROP VIEW IF EXISTS public.mg_tms CASCADE;

CREATE VIEW public.mg_tms AS
SELECT
  m.id,
  m.ld_num,
  m.so_num,
  m.acct_mgr_name,
  m.mbl,
  m.container_number,
  m.container_description,
  m.chassis_number,
  m.chassis_type,
  m.status,
  m.steamship_line,
  m.item_description,
  m.work_order,
  m.line_of_business,
  m.move_id_type,
  m.zero_rev,
  m.miles,
  m.weight,
  m.service_description,
  m.owner,
  m.carrier_name,
  m.carrier_scac,
  m.pickup_loc_name,
  m.pickup_loc_addr,
  m.pickup_loc_city,
  m.pickup_loc_state,
  m.pickup_loc_zip,
  m.pickup_region,
  m.drop_loc_name,
  m.drop_loc_addr,
  m.drop_loc_city,
  m.drop_loc_state,
  m.drop_loc_zip,
  m.drop_region,
  m.create_date,
  m.pickup_actual_date,
  m.drop_actual_date,
  m.actual_rc_date,
  m.margin_rate,
  m.margin_invoice,
  m.customer_rate_amount,
  m.customer_inv_amount,
  m.carrier_rate_amount,
  m.carrier_inv_amount,
  m.vendor_rate_amount,
  m.linehaul_fuel_cust_rate,
  m.linehaul_fuel_cust_inv,
  m.linehaul_fuel_carrier_rate,
  m.created_at,
  m.updated_at,
  cm.current_rate_per_day,
  cm.lessor,
  cm.gps_provider,
  cm.chassis_status,
  cm.chassis_type        AS chassis_master_type,
  cm.region              AS chassis_region,
  cm.serial_number,
  cm.on_hire_date,
  cm.off_hire_date
FROM forrest_legacy.tms_data m
LEFT JOIN public.chassis_master cm
  ON TRIM(m.chassis_number) = TRIM(cm.chassis_number);

NOTIFY pgrst, 'reload schema';
