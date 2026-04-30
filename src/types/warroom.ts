export type WarRoomStatus =
  | 'active'
  | 'dormant_low'
  | 'dormant_high'
  | 'in_transit'
  | 'returned';

export interface WarRoomChassis {
  location_id: number;
  location_name: string;
  latitude: number;
  longitude: number;
  location_type: string | null;
  city: string | null;
  state: string | null;
  chassis_number: string | null;
  chassis_type: string | null;
  status: string | null;
  cust_rate_charge: number | null;
  cust_invoice_charge: number | null;
  delivery_actual_date: string | null;
  actual_rc_date: string | null;
  ld_num: string | null;
  so_num: string | null;
  container_number: string | null;
  pickup_loc_name: string | null;
  delivery_loc_name: string | null;
  dormant_days: number | null;
  war_room_status: WarRoomStatus | null;
  est_missed_revenue: number | null;
}

export interface WarRoomKPI {
  total_locations: number;
  active_count: number;
  dormant_low_count: number;
  dormant_high_count: number;
  in_transit_count: number;
  returned_count: number;
  total_missed_revenue: number;
}

export const STATUS_COLORS: Record<WarRoomStatus, [number, number, number, number]> = {
  active:        [34,  197, 94,  220],
  dormant_low:   [251, 191, 36,  220],
  dormant_high:  [239, 68,  68,  240],
  in_transit:    [59,  130, 246, 200],
  returned:      [148, 163, 184, 180],
};

export const STATUS_LABELS: Record<WarRoomStatus, string> = {
  active:       'Active',
  dormant_low:  'Dormant < 3d',
  dormant_high: 'Dormant 3d+',
  in_transit:   'In Transit',
  returned:     'Returned',
};
