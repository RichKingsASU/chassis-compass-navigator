import { RevenueGapMetric } from '@/types/operations'

export const mockRevenueGapMetrics: RevenueGapMetric[] = [
  {
    period: '2024-01',
    targetRevenue: 450000,
    actualRevenue: 410000,
    projectedRevenue: 435000,
    gapAmount: 40000,
    gapPercent: 8.8
  },
  {
    period: '2024-02',
    targetRevenue: 480000,
    actualRevenue: 455000,
    projectedRevenue: 470000,
    gapAmount: 25000,
    gapPercent: 5.2
  },
  {
    period: '2024-03',
    targetRevenue: 520000,
    actualRevenue: 480000,
    projectedRevenue: 505000,
    gapAmount: 40000,
    gapPercent: 7.7
  },
  {
    period: '2024-04',
    targetRevenue: 500000,
    actualRevenue: 420000,
    projectedRevenue: 460000,
    gapAmount: 80000,
    gapPercent: 16.0
  }
]
