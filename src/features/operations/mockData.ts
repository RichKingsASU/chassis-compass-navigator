import { ChassisUtilizationMetric } from '@/types/operations'

export const mockChassisUtilization: ChassisUtilizationMetric[] = [
  {
    chassisNumber: 'CH-1001',
    status: 'ACTIVE',
    location: 'POLA PIER S',
    daysInUse: 25,
    daysIdle: 5,
    utilizationPercent: 83,
    customer: 'Target',
    lastMoveDate: '2024-04-20'
  },
  {
    chassisNumber: 'CH-1002',
    status: 'IDLE',
    location: 'LGB BERTH 100',
    daysInUse: 10,
    daysIdle: 20,
    utilizationPercent: 33,
    customer: null,
    lastMoveDate: '2024-04-10'
  },
  {
    chassisNumber: 'CH-1003',
    status: 'DORMANT',
    location: 'OAK TRAP',
    daysInUse: 2,
    daysIdle: 28,
    utilizationPercent: 6,
    customer: 'Walmart',
    lastMoveDate: '2024-03-25'
  },
  {
    chassisNumber: 'CH-1004',
    status: 'OOS',
    location: 'CHI YARD',
    daysInUse: 0,
    daysIdle: 30,
    utilizationPercent: 0,
    customer: null,
    lastMoveDate: '2024-03-01'
  }
]
