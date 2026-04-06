/**
 * Column presets for the unified chassis tracker table. Each preset
 * corresponds to a different operational role: dispatch cares about
 * location, finance cares about billing, leadership cares about KPIs.
 */
export const COLUMN_PRESETS = {
  dispatch: {
    label: 'Dispatch View',
    description: 'Chassis location, status, and load assignment',
    columns: [
      'chassis_number',
      'operational_status',
      'gps_location',
      'gps_last_seen',
      'last_terminal',
      'last_gate_event',
      'ld_num',
      'customer_name',
      'delivery_loc_name',
      'accruing_days',
      'dcli_date_out',
    ],
  },
  finance: {
    label: 'Finance View',
    description: 'Billing, invoice amounts, and per-diem exposure',
    columns: [
      'chassis_number',
      'dcli_reservation',
      'pool_contract',
      'dcli_vendor_days',
      'dcli_computed_days',
      'billed_vs_computed_days_delta',
      'dcli_date_out',
      'dcli_date_in',
      'cust_rate_charge',
      'cust_invoice_charge',
      'unbilledflag',
    ],
  },
  reporting: {
    label: 'Leadership View',
    description: 'Customer, revenue, and performance KPIs',
    columns: [
      'chassis_number',
      'customer_name',
      'ld_num',
      'tms_status',
      'pickup_loc_name',
      'delivery_loc_name',
      'delivery_actual_date',
      'actual_rc_date',
      'cust_rate_charge',
      'cust_invoice_charge',
    ],
  },
} as const

export type PresetKey = keyof typeof COLUMN_PRESETS
