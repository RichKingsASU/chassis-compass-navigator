import { UnbilledLoad } from '@/types/operations'

export const mockUnbilledLoads: UnbilledLoad[] = [
  {
    id: '1',
    loadNumber: 'LD-12345',
    customer: 'Target Logistics',
    carrier: 'Swift Transport',
    lane: 'LAX -> CHI',
    pickupDate: '2024-04-10',
    deliveryDate: '2024-04-15',
    status: 'Delivered',
    billableAmount: 1200,
    expectedRevenue: 1500,
    actualRevenue: 0,
    revenueGap: 1500,
    chassisNumber: 'CH-8829',
    containerNumber: 'CONT-9921',
    notes: 'Missing POD'
  },
  {
    id: '2',
    loadNumber: 'LD-67890',
    customer: 'Walmart',
    carrier: 'JB Hunt',
    lane: 'LGB -> DAL',
    pickupDate: '2024-04-12',
    deliveryDate: '2024-04-18',
    status: 'In Transit',
    billableAmount: 2100,
    expectedRevenue: 2500,
    actualRevenue: 0,
    revenueGap: 2500,
    chassisNumber: null,
    containerNumber: 'CONT-1122',
    notes: 'Chassis not yet assigned'
  },
  {
    id: '3',
    loadNumber: 'LD-11223',
    customer: 'Amazon',
    carrier: 'Knight-Swift',
    lane: 'OAK -> SEA',
    pickupDate: '2024-04-15',
    deliveryDate: '2024-04-20',
    status: 'Pending',
    billableAmount: 850,
    expectedRevenue: 1100,
    actualRevenue: 0,
    revenueGap: 1100,
    chassisNumber: 'CH-4455',
    containerNumber: 'CONT-3344',
    notes: null
  }
]
