// ─────────────────────────────────────────
// Unified chassis intelligence types
// Matches the chassis_mg_unified Supabase view
// ─────────────────────────────────────────

/** Row returned by the chassis_mg_unified view */
export interface ChassisUnifiedRow {
  chassis_id: number
  chassis_number: string
  chassis_type: string | null
  chassis_description: string | null
  chassis_status: string | null
  lessor: string | null
  notes: string | null
  chassis_updated_at: string | null

  // Latest MG load
  latest_ld_num: string | null
  latest_so_num: string | null
  latest_load_status: string | null
  customer_name: string | null
  acct_mgr_name: string | null
  carrier_name: string | null
  carrier_scac: string | null
  pickup_loc_name: string | null
  pickup_loc_city: string | null
  pickup_state: string | null
  pickup_actual_date: string | null
  delivery_loc_name: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_actual_date: string | null
  actual_rc_date: string | null
  container_number: string | null
  container_type: string | null
  mbl: string | null
  steamshipline: string | null
  service: string | null
  miles: string | null
  cust_rate_charge: number | null
  cust_invoice_charge: number | null
  carrier_rate_charge: number | null
  carrier_invoice_charge: number | null
  margin_rate: number | null
  load_created_date: string | null

  // DCLI / GPS location
  latest_dcli_location?: string | null

  // Aggregates
  total_loads: number | null
  total_revenue: number | null
  first_load_date: string | null
  last_load_date: string | null
}

/** Full detail for a single chassis — base record + related data */
export interface ChassisDetail {
  chassis: ChassisUnifiedRow
  loads: MgLoadSummary[]
}

/** Summary of a single MG load (from mg_data table) */
export interface MgLoadSummary {
  ld_num: string | null
  so_num: string | null
  status: string | null
  owner: string | null
  carrier_name: string | null
  carrier_scac: string | null
  pickup_loc_name: string | null
  pickup_loc_city: string | null
  pickup_loc_stateprovince: string | null
  pickup_actual_date: string | null
  drop_loc_name: string | null
  drop_loc_city: string | null
  drop_loc_stateprovince: string | null
  drop_actual_date: string | null
  container_number: string | null
  container_description: string | null
  mbl: string | null
  steamshipline: string | null
  service_description: string | null
  miles: string | null
  customer_rate_amount: string | null
  carrier_rate_amount: string | null
  margin_rate: string | null
  createdate: string | null
}

/** Financial summary for a chassis */
export interface ChassisFinancials {
  total_loads: number
  total_revenue: number
  avg_revenue_per_load: number
  total_carrier_cost: number
  net_margin: number
}
