import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  ActiveLoad,
  AxleSwapFlag,
  ChassisIdentity,
  DcliRow,
  GpsPing,
  LoadRow,
  PierSEventRow,
} from './types'

export interface PanelState<T> {
  data: T
  loading: boolean
  error: string | null
}

function init<T>(initial: T): PanelState<T> {
  return { data: initial, loading: true, error: null }
}

function parseLatLng(value: unknown): { lat: number | null; lng: number | null } {
  if (typeof value === 'string' && value.includes(',')) {
    const [a, b] = value.split(',').map((s) => Number(s.trim()))
    if (!isNaN(a) && !isNaN(b)) return { lat: a, lng: b }
  }
  return { lat: null, lng: null }
}

function asNumber(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return isNaN(n) ? null : n
}

function asString(v: unknown): string | null {
  if (v == null) return null
  return String(v)
}

interface RawRecord {
  [key: string]: unknown
}

interface BlackBerrySource {
  table: 'blackberry_tran_gps' | 'blackberry_log_gps'
  source: 'BlackBerry TRAN' | 'BlackBerry LOG'
}

const BB_SOURCES: BlackBerrySource[] = [
  { table: 'blackberry_tran_gps', source: 'BlackBerry TRAN' },
  { table: 'blackberry_log_gps', source: 'BlackBerry LOG' },
]

async function fetchBlackberryPings(
  chassis: string,
  source: BlackBerrySource,
  limit = 10
): Promise<GpsPing[]> {
  const { data, error } = await supabase
    .from(source.table)
    .select('*')
    .ilike('chassis_number', `%${chassis}%`)
    .order('recorded_on', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error
  return ((data || []) as RawRecord[]).map((r) => {
    const llString = asString(r.latitude_longitude)
    const parsed = llString ? parseLatLng(llString) : { lat: null, lng: null }
    return {
      source: source.source,
      timestamp: asString(r.recorded_on) ?? asString(r._load_ts),
      landmark: asString(r.geofence_name) ?? asString(r.geofence),
      address: asString(r.address),
      lat: asNumber(r.lat) ?? parsed.lat,
      lng: asNumber(r.lon) ?? asNumber(r.lng) ?? parsed.lng,
      raw: r,
    }
  })
}

async function fetchFleetlocatePings(
  chassis: string,
  limit = 10
): Promise<GpsPing[]> {
  const tables = ['fleetlocate_gps', 'gps_fleetlocate_history']
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .ilike('chassis_number', `%${chassis}%`)
      .limit(limit)
    if (error) {
      if (
        /not exist|relation|404|does not exist/i.test(error.message || '') ||
        (error as { code?: string }).code === '42P01' ||
        (error as { code?: string }).code === 'PGRST205'
      ) {
        continue
      }
      throw error
    }
    const rows = (data || []) as RawRecord[]
    rows.sort((a, b) => {
      const ta = a.recorded_on ?? a._load_ts ?? a.last_event_time ?? a.timestamp
      const tb = b.recorded_on ?? b._load_ts ?? b.last_event_time ?? b.timestamp
      return new Date(String(tb || 0)).getTime() - new Date(String(ta || 0)).getTime()
    })
    return rows.slice(0, limit).map((r) => ({
      source: 'FleetLocate',
      timestamp:
        asString(r.recorded_on) ??
        asString(r.last_event_time) ??
        asString(r.timestamp) ??
        asString(r._load_ts),
      landmark: asString(r.landmark) ?? asString(r.geofence_name) ?? asString(r.location),
      address: asString(r.address) ?? asString(r.full_address),
      lat: null,
      lng: null,
      raw: r,
    }))
  }
  return []
}

async function fetchAnytrekPings(chassis: string, limit = 10): Promise<GpsPing[]> {
  const tables = ['anytrek_gps', 'anytrek']
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .ilike('chassis_number', `%${chassis}%`)
      .limit(limit)
    if (error) {
      if (
        /not exist|relation|404|does not exist/i.test(error.message || '') ||
        (error as { code?: string }).code === '42P01' ||
        (error as { code?: string }).code === 'PGRST205'
      ) {
        continue
      }
      throw error
    }
    const rows = (data || []) as RawRecord[]
    rows.sort((a, b) => {
      const ta = a.recorded_on ?? a._load_ts ?? a.gps_time ?? a.timestamp
      const tb = b.recorded_on ?? b._load_ts ?? b.gps_time ?? b.timestamp
      return new Date(String(tb || 0)).getTime() - new Date(String(ta || 0)).getTime()
    })
    return rows.slice(0, limit).map((r) => {
      const lat = asNumber(r.lat) ?? asNumber(r.latitude)
      const lng = asNumber(r.lng) ?? asNumber(r.lon) ?? asNumber(r.longitude)
      return {
        source: 'Anytrek',
        timestamp:
          asString(r.recorded_on) ??
          asString(r.gps_time) ??
          asString(r.timestamp) ??
          asString(r._load_ts),
        landmark: asString(r.landmark) ?? asString(r.geofence_name),
        address: asString(r.address),
        lat,
        lng,
        raw: r,
      }
    })
  }
  return []
}

export interface ChassisDetailData {
  identity: PanelState<ChassisIdentity | null>
  bbTran: PanelState<GpsPing[]>
  bbLog: PanelState<GpsPing[]>
  fleetlocate: PanelState<GpsPing[]>
  anytrek: PanelState<GpsPing[]>
  activeLoad: PanelState<ActiveLoad | null>
  loads: PanelState<LoadRow[]>
  dcli: PanelState<DcliRow[]>
  pierS: PanelState<PierSEventRow[]>
  axleSwap: PanelState<AxleSwapFlag | null>
  refresh: () => void
}

export function useChassisDetailData(chassisNumber: string): ChassisDetailData {
  const trimmed = useMemo(() => chassisNumber.trim(), [chassisNumber])
  const [tick, setTick] = useState(0)

  const [identity, setIdentity] = useState<PanelState<ChassisIdentity | null>>(init(null))
  const [bbTran, setBbTran] = useState<PanelState<GpsPing[]>>(init<GpsPing[]>([]))
  const [bbLog, setBbLog] = useState<PanelState<GpsPing[]>>(init<GpsPing[]>([]))
  const [fleetlocate, setFleetlocate] = useState<PanelState<GpsPing[]>>(init<GpsPing[]>([]))
  const [anytrek, setAnytrek] = useState<PanelState<GpsPing[]>>(init<GpsPing[]>([]))
  const [activeLoad, setActiveLoad] = useState<PanelState<ActiveLoad | null>>(init(null))
  const [loads, setLoads] = useState<PanelState<LoadRow[]>>(init<LoadRow[]>([]))
  const [dcli, setDcli] = useState<PanelState<DcliRow[]>>(init<DcliRow[]>([]))
  const [pierS, setPierS] = useState<PanelState<PierSEventRow[]>>(init<PierSEventRow[]>([]))
  const [axleSwap, setAxleSwap] = useState<PanelState<AxleSwapFlag | null>>(init(null))

  useEffect(() => {
    if (!trimmed) return
    let cancelled = false

    const setIfAlive = <T,>(setter: (s: PanelState<T>) => void, s: PanelState<T>) => {
      if (!cancelled) setter(s)
    }

    setIdentity(init(null))
    setBbTran(init<GpsPing[]>([]))
    setBbLog(init<GpsPing[]>([]))
    setFleetlocate(init<GpsPing[]>([]))
    setAnytrek(init<GpsPing[]>([]))
    setActiveLoad(init(null))
    setLoads(init<LoadRow[]>([]))
    setDcli(init<DcliRow[]>([]))
    setPierS(init<PierSEventRow[]>([]))
    setAxleSwap(init(null))

    const run = async () => {
      // Identity (chassis_master is the local source of lessor/type/status)
      try {
        const { data, error } = await supabase
          .from('chassis_master')
          .select(
            'chassis_number, chassis_type, chassis_status, lessor, gps_provider, description'
          )
          .eq('chassis_number', trimmed)
          .maybeSingle()
        if (error && (error as { code?: string }).code !== 'PGRST116') throw error
        const row = (data || null) as RawRecord | null
        const identityValue: ChassisIdentity = {
          chassis_number: trimmed,
          chassis_type: asString(row?.chassis_type),
          chassis_size: asString(row?.description),
          lessor: asString(row?.lessor),
          gps_provider: asString(row?.gps_provider),
          chassis_status: asString(row?.chassis_status),
        }
        setIfAlive(setIdentity, { data: identityValue, loading: false, error: null })
      } catch (err) {
        setIfAlive(setIdentity, {
          data: {
            chassis_number: trimmed,
            chassis_type: null,
            chassis_size: null,
            lessor: null,
            gps_provider: null,
            chassis_status: null,
          },
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load identity',
        })
      }

      // GPS sources — independent
      void (async () => {
        try {
          const pings = await fetchBlackberryPings(trimmed, BB_SOURCES[0])
          setIfAlive(setBbTran, { data: pings, loading: false, error: null })
        } catch (err) {
          setIfAlive(setBbTran, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()
      void (async () => {
        try {
          const pings = await fetchBlackberryPings(trimmed, BB_SOURCES[1])
          setIfAlive(setBbLog, { data: pings, loading: false, error: null })
        } catch (err) {
          setIfAlive(setBbLog, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()
      void (async () => {
        try {
          const pings = await fetchFleetlocatePings(trimmed)
          setIfAlive(setFleetlocate, { data: pings, loading: false, error: null })
        } catch (err) {
          setIfAlive(setFleetlocate, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()
      void (async () => {
        try {
          const pings = await fetchAnytrekPings(trimmed)
          setIfAlive(setAnytrek, { data: pings, loading: false, error: null })
        } catch (err) {
          setIfAlive(setAnytrek, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()

      // Active load
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('mg_data')
            .select('*')
            .ilike('chassis_number', `%${trimmed}%`)
            .not('status', 'in', '("Delivered","Cancelled","Completed")')
            .order('created_date', { ascending: false, nullsFirst: false })
            .limit(1)
          if (error) throw error
          const row = ((data || [])[0] || null) as RawRecord | null
          if (!row) {
            setIfAlive(setActiveLoad, { data: null, loading: false, error: null })
            return
          }
          const al: ActiveLoad = {
            ld_num: asString(row.ld_num),
            so_num: asString(row.so_num),
            status: asString(row.status),
            customer_name: asString(row.customer_name) ?? asString(row.owner),
            acct_mg_name: asString(row.acct_mg_name) ?? asString(row.acct_mgr_name),
            carrier_name: asString(row.carrier_name),
            pickup_loc_name: asString(row.pickup_loc_name),
            pickup_city: asString(row.pickup_city) ?? asString(row.pickup_loc_city),
            pickup_state: asString(row.pickup_state) ?? asString(row.pickup_loc_state),
            pickup_actual_date: asString(row.pickup_actual_date),
            delivery_loc_name: asString(row.delivery_loc_name) ?? asString(row.drop_loc_name),
            delivery_city: asString(row.delivery_city) ?? asString(row.drop_loc_city),
            delivery_state: asString(row.delivery_state) ?? asString(row.drop_loc_state),
            delivery_actual_date:
              asString(row.delivery_actual_date) ?? asString(row.drop_actual_date),
            container_number: asString(row.container_number),
            container_type: asString(row.container_type) ?? asString(row.container_description),
            mbl: asString(row.mbl),
            service: asString(row.service) ?? asString(row.service_description),
            steamshipline: asString(row.steamshipline) ?? asString(row.steamship_line),
            cust_rate_charge:
              asNumber(row.cust_rate_charge) ?? asNumber(row.customer_rate_amount),
            carrier_rate_charge:
              asNumber(row.carrier_rate_charge) ?? asNumber(row.carrier_rate_amount),
          }
          setIfAlive(setActiveLoad, { data: al, loading: false, error: null })
        } catch (err) {
          setIfAlive(setActiveLoad, {
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()

      // TMS history
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('mg_data')
            .select('*')
            .ilike('chassis_number', `%${trimmed}%`)
            .order('created_date', { ascending: false, nullsFirst: false })
            .limit(50)
          if (error) throw error
          const rows = ((data || []) as RawRecord[]).map((r) => ({
            ld_num: asString(r.ld_num),
            so_num: asString(r.so_num),
            status: asString(r.status),
            customer_name: asString(r.customer_name) ?? asString(r.owner),
            acct_mg_name: asString(r.acct_mg_name) ?? asString(r.acct_mgr_name),
            carrier_name: asString(r.carrier_name),
            pickup_loc_name: asString(r.pickup_loc_name),
            pickup_city: asString(r.pickup_city) ?? asString(r.pickup_loc_city),
            pickup_state: asString(r.pickup_state) ?? asString(r.pickup_loc_state),
            pickup_actual_date: asString(r.pickup_actual_date),
            delivery_loc_name: asString(r.delivery_loc_name) ?? asString(r.drop_loc_name),
            delivery_city: asString(r.delivery_city) ?? asString(r.drop_loc_city),
            delivery_state: asString(r.delivery_state) ?? asString(r.drop_loc_state),
            delivery_actual_date:
              asString(r.delivery_actual_date) ?? asString(r.drop_actual_date),
            container_number: asString(r.container_number),
            container_type:
              asString(r.container_type) ?? asString(r.container_description),
            mbl: asString(r.mbl),
            service: asString(r.service) ?? asString(r.service_description),
            cust_rate_charge:
              asNumber(r.cust_rate_charge) ?? asNumber(r.customer_rate_amount),
            cust_invoice_charge:
              asNumber(r.cust_invoice_charge) ?? asNumber(r.customer_inv_amount),
            carrier_rate_charge:
              asNumber(r.carrier_rate_charge) ?? asNumber(r.carrier_rate_amount),
            carrier_invoice_charge:
              asNumber(r.carrier_invoice_charge) ?? asNumber(r.carrier_inv_amount),
            miles: asNumber(r.miles),
            zero_rev: asString(r.zero_rev),
            created_date: asString(r.created_date) ?? asString(r.create_date),
            ...r,
          })) as LoadRow[]
          setIfAlive(setLoads, { data: rows, loading: false, error: null })
        } catch (err) {
          setIfAlive(setLoads, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()

      // DCLI activity
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('dcli_activity')
            .select(
              'date_out, date_in, pick_up_location, location_in, days_out, container, ss_scac, reservation, asset_type'
            )
            .ilike('chassis', `%${trimmed}%`)
            .order('date_out', { ascending: false, nullsFirst: false })
            .limit(10)
          if (error) throw error
          setIfAlive(setDcli, {
            data: ((data || []) as DcliRow[]),
            loading: false,
            error: null,
          })
        } catch (err) {
          setIfAlive(setDcli, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()

      // Pier S yard events
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('yard_events_data')
            .select(
              '"ChassisNo", "ContainerNo", "EventDate", "EventTime", "Terminal", "EventDescription"'
            )
            .ilike('ChassisNo', `%${trimmed}%`)
            .order('EventDate', { ascending: false, nullsFirst: false })
            .limit(20)
          if (error) {
            // fallback: lower-case event_date column
            const fallback = await supabase
              .from('yard_events_data')
              .select('*')
              .ilike('chassis_number', `%${trimmed}%`)
              .order('event_date', { ascending: false, nullsFirst: false })
              .limit(20)
            if (fallback.error) throw fallback.error
            const rows = ((fallback.data || []) as RawRecord[]).map((r) => ({
              ChassisNo: asString(r.ChassisNo) ?? asString(r.chassis_number),
              ContainerNo: asString(r.ContainerNo) ?? asString(r.container_number),
              EventDate: asString(r.EventDate) ?? asString(r.event_date),
              EventTime: asString(r.EventTime) ?? asString(r.event_time),
              Terminal: asString(r.Terminal) ?? asString(r.yard) ?? asString(r.terminal),
              EventDescription:
                asString(r.EventDescription) ?? asString(r.event_type) ?? asString(r.status),
            }))
            setIfAlive(setPierS, { data: rows, loading: false, error: null })
            return
          }
          setIfAlive(setPierS, {
            data: ((data || []) as PierSEventRow[]),
            loading: false,
            error: null,
          })
        } catch (err) {
          setIfAlive(setPierS, {
            data: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()

      // Axle swap flag
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('axle_swap_chassis')
            .select('*')
            .eq('chassis_number', trimmed)
            .maybeSingle()
          if (error) {
            // table likely doesn't exist locally
            const code = (error as { code?: string }).code
            if (code === '42P01' || code === 'PGRST205' || code === 'PGRST116') {
              setIfAlive(setAxleSwap, { data: null, loading: false, error: null })
              return
            }
            throw error
          }
          const row = (data || null) as RawRecord | null
          if (!row) {
            setIfAlive(setAxleSwap, { data: null, loading: false, error: null })
            return
          }
          // try to enrich with dwell summary
          let dwellDays: number | null = null
          try {
            const dwell = await supabase
              .from('v_axle_swap_dwell_summary')
              .select('*')
              .eq('chassis_number', trimmed)
              .maybeSingle()
            if (!dwell.error && dwell.data) {
              dwellDays =
                asNumber((dwell.data as RawRecord).dwell_days) ??
                asNumber((dwell.data as RawRecord).total_dwell_days)
            }
          } catch {
            /* ignore */
          }
          setIfAlive(setAxleSwap, {
            data: {
              chassis_number: trimmed,
              yard_name: asString(row.yard_name) ?? asString(row.blacklisted_yard),
              yard_address: asString(row.yard_address) ?? asString(row.address),
              detection_date: asString(row.detection_date) ?? asString(row.detected_at),
              dwell_days: dwellDays ?? asNumber(row.dwell_days),
            },
            loading: false,
            error: null,
          })
        } catch (err) {
          setIfAlive(setAxleSwap, {
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed',
          })
        }
      })()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [trimmed, tick])

  return {
    identity,
    bbTran,
    bbLog,
    fleetlocate,
    anytrek,
    activeLoad,
    loads,
    dcli,
    pierS,
    axleSwap,
    refresh: () => setTick((t) => t + 1),
  }
}
