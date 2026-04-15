// ─────────────────────────────────────────
// Chassis types — aligned to local schema
// chassis_master table + mg_data table
// ─────────────────────────────────────────

/** Row returned by chassis_master */
export interface ChassisUnifiedRow {
  chassis_number: string
  chassis_type: string | null
  chassis_status: string | null
  lessor: string | null
  region: string | null
  gps_provider: string | null
  current_rate_per_day: number | null
  serial_number: string | null
  on_hire_date: string | null
  off_hire_date: string | null

  // Optional aggregates (computed client-side)
  total_loads?: number | null
  total_revenue?: number | null
  first_load_date?: string | null
  last_load_date?: string | null
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
  pickup_loc_state: string | null
  pickup_actual_date: string | null
  drop_loc_name: string | null
  drop_loc_city: string | null
  drop_loc_state: string | null
  drop_actual_date: string | null
  container_number: string | null
  container_description: string | null
  mbl: string | null
  steamship_line: string | null
  service_description: string | null
  miles: string | null
  customer_rate_amount: string | null
  carrier_rate_amount: string | null
  margin_rate: string | null
  create_date: string | null
}

/** Financial summary for a chassis */
export interface ChassisFinancials {
  total_loads: number
  total_revenue: number
  avg_revenue_per_load: number
  total_carrier_cost: number
  net_margin: number
}
