export interface UnbilledLoad {
  id: string
  loadNumber: string
  customer: string
  carrier: string
  lane: string
  pickupDate: string
  deliveryDate: string
  status: string
  billableAmount: number
  expectedRevenue: number
  actualRevenue: number
  revenueGap: number
  chassisNumber: string | null
  containerNumber: string | null
  notes: string | null
}

export interface RevenueGapMetric {
  period: string
  targetRevenue: number
  actualRevenue: number
  projectedRevenue: number
  gapAmount: number
  gapPercent: number
}

export interface ChassisUtilizationMetric {
  chassisNumber: string
  status: 'ACTIVE' | 'IDLE' | 'DORMANT' | 'OOS'
  location: string | null
  daysInUse: number
  daysIdle: number
  utilizationPercent: number
  customer: string | null
  lastMoveDate: string | null
}

export interface UtilizationRow {
  chassis_number: string
  lessor: string | null
  chassis_type: string | null
  utilization_status: string | null
  region: string | null
  total_loads: number | null
  days_idle: number | null
  last_activity_date: string | null
  acct_mgr: string | null
  first_load_date: string | null
  on_hire_date: string | null
  off_hire_date: string | null
  contract_end_date: string | null
  total_revenue: number | null
  chassis_status?: string | null
  notes?: string | null
}
