import { supabase } from '@/lib/supabase'
import type {
  ChassisUnifiedRow,
  ChassisDetail,
  MgLoadSummary,
  ChassisFinancials,
} from '@/types/chassis'

/**
 * Get all chassis with unified MG data for table display.
 * Used by Overview, Long Term, Short Term views.
 */
export async function getChassisUnified(filters?: {
  status?: string
  chassis_type?: string
  min_dormant_days?: number
  max_dormant_days?: number
}): Promise<ChassisUnifiedRow[]> {
  let query = supabase
    .from('chassis_mg_unified')
    .select('*')
    .order('chassis_number')

  if (filters?.status) {
    query = query.eq('chassis_status', filters.status)
  }
  if (filters?.chassis_type) {
    query = query.eq('chassis_type', filters.chassis_type)
  }

  const { data, error } = await query.limit(1000)
  if (error) throw error

  let rows = (data as ChassisUnifiedRow[]) || []

  // Client-side dormancy filtering (days since last_load_date)
  if (filters?.min_dormant_days != null || filters?.max_dormant_days != null) {
    const now = Date.now()
    rows = rows.filter((r) => {
      if (!r.last_load_date) return filters?.min_dormant_days != null
      const daysSince = Math.floor((now - new Date(r.last_load_date).getTime()) / 86_400_000)
      if (filters?.min_dormant_days != null && daysSince < filters.min_dormant_days) return false
      if (filters?.max_dormant_days != null && daysSince > filters.max_dormant_days) return false
      return true
    })
  }

  return rows
}

/**
 * Get full detail for a single chassis including:
 * - chassis base record (from unified view)
 * - all mg_data loads (last 50, ordered by createdate DESC)
 */
export async function getChassisDetail(chassisNumber: string): Promise<ChassisDetail> {
  const trimmed = chassisNumber.trim()

  const [unifiedRes, loadsRes] = await Promise.all([
    supabase
      .from('chassis_mg_unified')
      .select('*')
      .eq('chassis_number', trimmed)
      .limit(1)
      .single(),

    supabase
      .from('mg_data')
      .select(
        'ld_num, so_num, status, owner, carrier_name, carrier_scac, ' +
        'pickup_loc_name, pickup_loc_city, pickup_loc_stateprovince, pickup_actual_date, ' +
        'drop_loc_name, drop_loc_city, drop_loc_stateprovince, drop_actual_date, ' +
        'container_number, container_description, mbl, steamshipline, service_description, ' +
        'miles, customer_rate_amount, carrier_rate_amount, margin_rate, createdate'
      )
      .ilike('chassis_number', `%${trimmed}%`)
      .order('createdate', { ascending: false })
      .limit(50),
  ])

  if (unifiedRes.error) throw unifiedRes.error

  return {
    chassis: unifiedRes.data as ChassisUnifiedRow,
    loads: loadsRes.error ? [] : ((loadsRes.data ?? []) as MgLoadSummary[]),
  }
}

/**
 * Get chassis load history summary for mini-table in drawer.
 */
export async function getChassisLoadHistory(chassisNumber: string): Promise<MgLoadSummary[]> {
  const trimmed = chassisNumber.trim()

  const { data, error } = await supabase
    .from('mg_data')
    .select(
      'ld_num, so_num, status, owner, carrier_name, carrier_scac, ' +
      'pickup_loc_name, pickup_loc_city, pickup_loc_stateprovince, pickup_actual_date, ' +
      'drop_loc_name, drop_loc_city, drop_loc_stateprovince, drop_actual_date, ' +
      'container_number, container_description, mbl, steamshipline, service_description, ' +
      'miles, customer_rate_amount, carrier_rate_amount, margin_rate, createdate'
    )
    .ilike('chassis_number', `%${trimmed}%`)
    .order('createdate', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as MgLoadSummary[]
}

/**
 * Get chassis financial summary.
 * Returns: total_loads, total_revenue, avg_revenue_per_load,
 *          total_carrier_cost, net_margin
 */
export async function getChassisFinancials(chassisNumber: string): Promise<ChassisFinancials> {
  const trimmed = chassisNumber.trim()

  const { data, error } = await supabase
    .from('mg_data')
    .select('customer_rate_amount, carrier_rate_amount')
    .ilike('chassis_number', `%${trimmed}%`)

  if (error) throw error

  const rows = data || []
  const totalLoads = rows.length
  const totalRevenue = rows.reduce((sum, r) => sum + (parseFloat(r.customer_rate_amount) || 0), 0)
  const totalCarrierCost = rows.reduce((sum, r) => sum + (parseFloat(r.carrier_rate_amount) || 0), 0)

  return {
    total_loads: totalLoads,
    total_revenue: totalRevenue,
    avg_revenue_per_load: totalLoads > 0 ? totalRevenue / totalLoads : 0,
    total_carrier_cost: totalCarrierCost,
    net_margin: totalRevenue - totalCarrierCost,
  }
}
