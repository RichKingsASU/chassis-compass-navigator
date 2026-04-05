export const COLUMN_LABELS: Record<string, string> = {
  ld_num: 'Load #',
  so_num: 'SO #',
  container_number: 'Container #',
  chassis_number: 'Chassis #',
  acct_mg_name: 'Account Manager',
  cust_rate_charge: 'Customer Rate',
  cust_invoice_charge: 'Customer Invoice',
  carrier_rate_charge: 'Carrier Rate',
  carrier_invoice_charge: 'Carrier Invoice',
  zero_rev: 'Zero Revenue',
  unbilledflag: 'Unbilled',
  dropandpull: 'Drop & Pull',
  direct_nvo: 'Direct/NVO',
  delivery_actual_date: 'Actual Delivery',
  actual_rc_date: 'Container Return',
  pickup_actual_date: 'Actual Pickup',
  servicemode: 'Service Mode',
  last_free_date: 'Last Free Date',
  steamshipline: 'Steamship Line',
  vessel_eta: 'Vessel ETA',
  pod_received: 'POD Received',
  isemptyatyard: 'Empty at Yard',
}

export const HIDDEN_COLUMNS = [
  'Notes(delete)',
  'Action Needed(delete)',
  'Notes-New',
  'Action Needed - New',
  'Adddress',
]

export function getColumnLabel(fieldName: string): string {
  return COLUMN_LABELS[fieldName] ?? fieldName
}
