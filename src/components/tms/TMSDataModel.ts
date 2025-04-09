
// Define status type to restrict possible values
export type TMSStatus = 'active' | 'pending' | 'completed';

// Define type for TMS data sources
export type TMSSource = 'McLeod' | 'Trimble' | 'MercuryGate' | 'Oracle TMS';

// Define type for TMS data types
export type TMSType = 'Order' | 'Dispatch' | 'Shipment' | 'Invoice';

// Main data interface with more specific types
export interface TMSDataItem {
  id: string;
  source: TMSSource;
  type: TMSType;
  referenceId: string;
  timestamp: string;
  details: string;
  status: TMSStatus;
}

// Filter interface for type safety when filtering data
export interface TMSFiltersState {
  source: string;
  type: string;
  status: string;
}

// Mock data for TMS data
export const tmsData: TMSDataItem[] = [
  {
    id: 'TMS-1001',
    source: 'McLeod',
    type: 'Order',
    referenceId: 'ORD-5678',
    timestamp: '2025-04-09 08:23 AM',
    details: 'Delivery to Charleston, SC',
    status: 'active'
  },
  {
    id: 'TMS-1002',
    source: 'Trimble',
    type: 'Dispatch',
    referenceId: 'DSP-8765',
    timestamp: '2025-04-09 07:45 AM',
    details: 'Pickup from Savannah, GA',
    status: 'pending'
  },
  {
    id: 'TMS-1003',
    source: 'MercuryGate',
    type: 'Shipment',
    referenceId: 'SHP-9012',
    timestamp: '2025-04-08 04:15 PM',
    details: 'Atlanta to Miami route',
    status: 'completed'
  },
  {
    id: 'TMS-1004',
    source: 'McLeod',
    type: 'Order',
    referenceId: 'ORD-3456',
    timestamp: '2025-04-08 01:30 PM',
    details: 'Port pickup - Jacksonville',
    status: 'pending'
  },
  {
    id: 'TMS-1005',
    source: 'Oracle TMS',
    type: 'Invoice',
    referenceId: 'INV-7890',
    timestamp: '2025-04-08 10:05 AM',
    details: 'Billing for delivery #DSP-8765',
    status: 'active'
  },
  {
    id: 'TMS-1006',
    source: 'Trimble',
    type: 'Dispatch',
    referenceId: 'DSP-6543',
    timestamp: '2025-04-07 03:22 PM',
    details: 'Intermodal transfer - Norfolk',
    status: 'completed'
  },
  {
    id: 'TMS-1007',
    source: 'MercuryGate',
    type: 'Shipment',
    referenceId: 'SHP-7654',
    timestamp: '2025-04-07 11:14 AM',
    details: 'Houston to Dallas route',
    status: 'active'
  },
  {
    id: 'TMS-1008',
    source: 'Oracle TMS',
    type: 'Invoice',
    referenceId: 'INV-8901',
    timestamp: '2025-04-06 08:45 PM',
    details: 'Billing for delivery #DSP-6543',
    status: 'pending'
  },
];
