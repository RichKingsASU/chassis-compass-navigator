import { InventoryStatus } from './types';

// YARD_CONFIG is now dynamic — loaded from Supabase yards table per yard
// See src/features/yard/services/yardService.ts

export const STATUS_COLORS: Record<InventoryStatus, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400 border-green-500/30',
  EMPTY: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LOADED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  RESERVED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SHOP: 'bg-red-500/20 text-red-400 border-red-500/30',
  EXITED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const CHASSIS_TYPES = [
  'Forrest 40',
  'Forrest 20 Triaxle',
  'Forrest 20 Standard',
  'Forrest 45',
  'MCC 40',
  'MCC 20',
  'Other',
];

export const STATUS_OPTIONS: InventoryStatus[] = [
  'AVAILABLE',
  'EMPTY',
  'LOADED',
  'RESERVED',
  'SHOP',
  'EXITED',
];
