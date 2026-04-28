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
