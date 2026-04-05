export const COLUMN_LABELS: Record<string, string> = {
  'ld_num': 'Load #',
  'so_num': 'SO #',
  'ld_num_format': 'Load # (Formatted)',
  'so_num_format': 'SO # (Formatted)',
  'container_number': 'Container #',
  'container_number_format': 'Container # (Formatted)',
  'chassis_number': 'Chassis #',
  'chassis_number_format': 'Chassis # (Formatted)',
  'acct_mg_name': 'Account Manager',
  'cust_rate_charge': 'Customer Rate',
  'cust_invoice_charge': 'Customer Invoice',
  'carrier_rate_charge': 'Carrier Rate',
  'carrier_invoice_charge': 'Carrier Invoice',
  'zero_rev': 'Zero Revenue',
  'unbilledflag': 'Unbilled Flag',
  'dropandpull': 'Drop & Pull',
  'direct_nvo': 'Direct/NVO',
  'delivery_actual_date': 'Actual Delivery',
  'actual_rc_date': 'Container Return Date',
  'pickup_actual_date': 'Actual Pickup',
  'isemptyatyard': 'Empty at Yard',
  'isemptycontainerpickup': 'Empty Container Pickup',
  'servicemode': 'Service Mode',
  'last_free_date': 'Last Free Date',
  'steamshipline': 'Steamship Line',
  'vessel_eta': 'Vessel ETA',
  'Adddress': 'Address',
  'pod_received': 'POD Received',
  'pod_status': 'POD Status',
  'customer_name': 'Customer',
  'carrier_name': 'Carrier',
  'shipment_number': 'Shipment #',
  'created_date': 'Created Date',
  'created_at': 'Created At',
  'status': 'Status',
}

/** Columns that should be hidden — deprecated source data artifacts */
export const HIDDEN_COLUMNS = new Set([
  'Notes(delete)',
  'Action Needed(delete)',
  'Notes-New',
  'Action Needed - New',
])

/** Get display label for a column, falling back to the raw name */
export function getColumnLabel(field: string): string {
  return COLUMN_LABELS[field] ?? field
}
