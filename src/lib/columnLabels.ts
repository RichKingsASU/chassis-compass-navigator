export const COLUMN_LABELS: Record<string, string> = {
  ld_num: 'Load #',
  so_num: 'SO #',
  container_number: 'Container #',
  chassis_number: 'Chassis #',
  acct_mgr_name: 'Account Manager',
  customer_rate_amount: 'Customer Rate',
  customer_inv_amount: 'Customer Invoice',
  carrier_rate_amount: 'Carrier Rate',
  carrier_inv_amount: 'Carrier Invoice',
  zero_rev: 'Zero Revenue',
  drop_actual_date: 'Actual Drop',
  actual_rc_date: 'Container Return',
  pickup_actual_date: 'Actual Pickup',
  create_date: 'Created',
  steamship_line: 'Steamship Line',
  pickup_loc_name: 'Pickup Location',
  drop_loc_name: 'Drop Location',
  carrier_name: 'Carrier',
  status: 'Status',
  chassis_status: 'Status',
  chassis_type: 'Chassis Type',
  margin_rate: 'Margin (Rate)',
  margin_invoice: 'Margin (Invoice)',
}

export function getColumnLabel(fieldName: string): string {
  return COLUMN_LABELS[fieldName] ?? fieldName
}
