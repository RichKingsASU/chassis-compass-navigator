export interface ChassisIdentity {
  chassis_number: string
  chassis_type: string | null
  chassis_size: string | null
  lessor: string | null
  gps_provider: string | null
  chassis_status: string | null
}

export interface GpsPing {
  source: 'BlackBerry TRAN' | 'BlackBerry LOG' | 'FleetLocate' | 'Anytrek'
  timestamp: string | null
  landmark: string | null
  address: string | null
  lat: number | null
  lng: number | null
  raw: Record<string, unknown>
}

export interface ActiveLoad {
  ld_num: string | null
  so_num: string | null
  status: string | null
  customer_name: string | null
  acct_mg_name: string | null
  carrier_name: string | null
  pickup_loc_name: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_actual_date: string | null
  delivery_loc_name: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_actual_date: string | null
  container_number: string | null
  container_type: string | null
  mbl: string | null
  service: string | null
  steamshipline: string | null
  cust_rate_charge: number | null
  carrier_rate_charge: number | null
}

export interface LoadRow {
  ld_num: string | null
  so_num: string | null
  status: string | null
  customer_name: string | null
  acct_mg_name: string | null
  carrier_name: string | null
  pickup_loc_name: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_actual_date: string | null
  delivery_loc_name: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_actual_date: string | null
  container_number: string | null
  container_type: string | null
  mbl: string | null
  service: string | null
  cust_rate_charge: number | null
  cust_invoice_charge: number | null
  carrier_rate_charge: number | null
  carrier_invoice_charge: number | null
  miles: number | null
  zero_rev: string | null
  created_date: string | null
  [k: string]: unknown
}

export interface DcliRow {
  date_out: string | null
  date_in: string | null
  pick_up_location: string | null
  location_in: string | null
  days_out: number | null
  container: string | null
  ss_scac: string | null
  reservation: string | null
  asset_type: string | null
}

export interface PierSEventRow {
  ChassisNo: string | null
  ContainerNo: string | null
  EventDate: string | null
  EventTime: string | null
  Terminal: string | null
  EventDescription: string | null
}

export interface AxleSwapFlag {
  chassis_number: string
  yard_name: string | null
  yard_address: string | null
  detection_date: string | null
  dwell_days: number | null
}

export interface ChassisAgentSummary {
  identity: ChassisIdentity
  latestPing: GpsPing | null
  activeLoad: ActiveLoad | null
  loads: LoadRow[]
  dcliRows: DcliRow[]
  pierSCount: number
  pierSLatest: string | null
  axleSwap: AxleSwapFlag | null
  perSourceLast: Record<string, string | null>
}
