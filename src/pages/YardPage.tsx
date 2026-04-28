import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Inbox, MapPin } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import ChassisDetailDrawer from '@/components/chassis/ChassisDetailDrawer'

interface Yard {
  id: string
  name: string
  short_code: string | null
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  capacity: number | null
  daily_rate: number | null
  active: boolean | null
}

interface YardInventoryItem {
  id: string
  yard_id: string
  chassis_number: string
  status: string | null
  container_number: string | null
  spot: string | null
  account_manager: string | null
  planned_exit_date: string | null
  inbound_carrier: string | null
  inbound_driver_name: string | null
  outbound_carrier: string | null
  exit_reason: string | null
  actual_exit_at: string | null
  reservation_notes: string | null
  created_at: string | null
}

interface JedYardEvent {
  chassis_number_clean: string | null
  direction: string | null
  event_date: string | null
  event_time: string | null
  container_number: string | null
  driver_name: string | null
  carrier: string | null
  match_confidence: string | null
  tms_customer: string | null
  tms_ld_num: string | null
}

interface YardEventData {
  ChassisNo: string | null
  EventDate: string | null
  EventTime: string | null
  EventDescription: string | null
  ContainerNo: string | null
  LicensePlate: string | null
  Terminal: string | null
}

interface YardConfig {
  shortCode: string
  title: string
  gateSource: 'yard_inventory' | 'jed_yard_events' | 'yard_events_data'
  terminalFilter?: string
}

const YARD_CONFIG: Record<string, YardConfig> = {
  '17th': { shortCode: '17TH', title: '17th St Yard', gateSource: 'yard_inventory' },
  jed: { shortCode: 'JED', title: 'JED Yard', gateSource: 'jed_yard_events' },
  'pier-s': {
    shortCode: 'PIERS',
    title: 'Pier S',
    gateSource: 'yard_events_data',
    terminalFilter: 'PIER S',
  },
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMoney(amount: number | null): string {
  if (amount == null) return '—'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'EMPTY':
      return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20">EMPTY</Badge>
    case 'LOADED':
      return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20">LOADED</Badge>
    case 'SHOP':
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">SHOP</Badge>
    case 'RESERVED':
      return (
        <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/20">RESERVED</Badge>
      )
    default:
      return <Badge variant="outline">{s || 'Unknown'}</Badge>
  }
}

function DirectionBadge({ dir }: { dir: string | null }) {
  const d = (dir || '').toUpperCase()
  if (d === 'IN' || d === 'INBOUND')
    return <Badge className="bg-green-500/15 text-green-700">IN</Badge>
  if (d === 'OUT' || d === 'OUTBOUND')
    return <Badge className="bg-amber-500/15 text-amber-700">OUT</Badge>
  return <Badge variant="outline">{d || '—'}</Badge>
}

function MatchBadge({ conf }: { conf: string | null }) {
  const c = (conf || '').toUpperCase()
  if (!c) return <span className="text-muted-foreground">—</span>
  if (c === 'HIGH' || c === 'EXACT')
    return <Badge className="bg-green-500/15 text-green-700">{c}</Badge>
  if (c === 'MEDIUM' || c === 'PARTIAL')
    return <Badge className="bg-amber-500/15 text-amber-700">{c}</Badge>
  return <Badge variant="outline">{c}</Badge>
}

export default function YardPage() {
  const params = useParams<{ slug?: string }>()
  const slug = (params.slug || '') as keyof typeof YARD_CONFIG
  const config = YARD_CONFIG[slug]
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedChassis, setSelectedChassis] = React.useState<string | null>(null)

  if (!config) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Inbox}
          title="Unknown yard"
          description={`No yard configured for "${slug}".`}
        />
      </div>
    )
  }

  return <YardPageContent config={config} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} selectedChassis={selectedChassis} setSelectedChassis={setSelectedChassis} />
}

function YardPageContent({
  config,
  drawerOpen,
  setDrawerOpen,
  selectedChassis,
  setSelectedChassis,
}: {
  config: YardConfig
  drawerOpen: boolean
  setDrawerOpen: (b: boolean) => void
  selectedChassis: string | null
  setSelectedChassis: (s: string | null) => void
}) {
  const { data: yard } = useQuery<Yard | null>({
    queryKey: ['yard', config.shortCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select('*')
        .eq('short_code', config.shortCode)
        .maybeSingle()
      if (error) throw error
      return (data as Yard | null) ?? null
    },
  })

  const { data: inventoryActive } = useQuery<YardInventoryItem[]>({
    queryKey: ['yard_inventory', 'by_yard', yard?.id],
    enabled: !!yard?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*')
        .eq('yard_id', yard!.id)
        .is('actual_exit_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as YardInventoryItem[]
    },
  })

  const { data: inventoryHistory } = useQuery<YardInventoryItem[]>({
    queryKey: ['yard_inventory', 'history', yard?.id],
    enabled: !!yard?.id && config.gateSource === 'yard_inventory',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*')
        .eq('yard_id', yard!.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as YardInventoryItem[]
    },
  })

  const { data: jedEvents } = useQuery<JedYardEvent[]>({
    queryKey: ['jed_yard_events', config.shortCode],
    enabled: config.gateSource === 'jed_yard_events',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jed_yard_events')
        .select('*')
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as JedYardEvent[]
    },
  })

  const { data: pierSEvents } = useQuery<YardEventData[]>({
    queryKey: ['yard_events_data', config.terminalFilter],
    enabled: config.gateSource === 'yard_events_data',
    queryFn: async () => {
      let query = supabase
        .from('yard_events_data')
        .select('"ChassisNo","EventDate","EventTime","EventDescription","ContainerNo","LicensePlate","Terminal"')
        .order('EventDate', { ascending: false })
        .limit(100)
      if (config.terminalFilter) {
        query = query.eq('Terminal', config.terminalFilter)
      }
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as YardEventData[]
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
        {yard && (
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {[yard.address_line1, yard.city, yard.state, yard.zip].filter(Boolean).join(', ') ||
              'No address on file'}
          </p>
        )}
      </div>

      {yard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Yard Name</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{yard.name}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yard.capacity ?? '—'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Daily Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMoney(yard.daily_rate)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryActive?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>Active chassis at this yard</CardDescription>
        </CardHeader>
        <CardContent>
          {!yard ? (
            <EmptyState
              icon={Inbox}
              title="Yard not configured"
              description={`No yards row found with short_code = "${config.shortCode}".`}
            />
          ) : (inventoryActive ?? []).length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No active inventory"
              description="No chassis currently at this yard."
            />
          ) : (
            <div className="overflow-auto max-h-[50vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spot</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>AM</TableHead>
                    <TableHead>Inbound Carrier</TableHead>
                    <TableHead>Planned Exit</TableHead>
                    <TableHead>Arrived</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventoryActive ?? []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.spot || '—'}</TableCell>
                      <TableCell>
                        <button
                          className="font-mono font-medium text-primary hover:underline"
                          onClick={() => {
                            setSelectedChassis(i.chassis_number)
                            setDrawerOpen(true)
                          }}
                        >
                          {i.chassis_number}
                        </button>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                      </TableCell>
                      <TableCell>{i.container_number || '—'}</TableCell>
                      <TableCell>{i.account_manager || '—'}</TableCell>
                      <TableCell>{i.inbound_carrier || '—'}</TableCell>
                      <TableCell>{formatDate(i.planned_exit_date)}</TableCell>
                      <TableCell>{formatDate(i.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gate Event Log</CardTitle>
          <CardDescription>
            {config.gateSource === 'jed_yard_events'
              ? 'JED yard gate events'
              : config.gateSource === 'yard_events_data'
              ? 'Pier S yard events'
              : '17th St yard inventory history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.gateSource === 'jed_yard_events' && (
            <JedEventsTable events={jedEvents ?? []} />
          )}
          {config.gateSource === 'yard_events_data' && (
            <PierSEventsTable events={pierSEvents ?? []} />
          )}
          {config.gateSource === 'yard_inventory' && (
            <InventoryHistoryTable items={inventoryHistory ?? []} />
          )}
        </CardContent>
      </Card>

      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

function JedEventsTable({ events }: { events: JedYardEvent[] }) {
  if (events.length === 0) {
    return <EmptyState icon={Inbox} title="No gate events" description="No events recorded." />
  }
  return (
    <div className="overflow-auto max-h-[60vh] border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Chassis</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Match Confidence</TableHead>
            <TableHead>Customer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e, idx) => (
            <TableRow key={`${e.chassis_number_clean}-${e.event_date}-${e.event_time}-${idx}`}>
              <TableCell>{formatDate(e.event_date)}</TableCell>
              <TableCell>{e.event_time || '—'}</TableCell>
              <TableCell>
                <DirectionBadge dir={e.direction} />
              </TableCell>
              <TableCell className="font-mono">{e.chassis_number_clean || '—'}</TableCell>
              <TableCell>{e.container_number || '—'}</TableCell>
              <TableCell>{e.driver_name || '—'}</TableCell>
              <TableCell>{e.carrier || '—'}</TableCell>
              <TableCell>
                <MatchBadge conf={e.match_confidence} />
              </TableCell>
              <TableCell>{e.tms_customer || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PierSEventsTable({ events }: { events: YardEventData[] }) {
  if (events.length === 0) {
    return <EmptyState icon={Inbox} title="No gate events" description="No events recorded." />
  }
  return (
    <div className="overflow-auto max-h-[60vh] border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Chassis</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Terminal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e, idx) => (
            <TableRow key={`${e.ChassisNo}-${e.EventDate}-${e.EventTime}-${idx}`}>
              <TableCell>{formatDate(e.EventDate)}</TableCell>
              <TableCell>{e.EventTime || '—'}</TableCell>
              <TableCell>{e.EventDescription || '—'}</TableCell>
              <TableCell className="font-mono">{e.ChassisNo || '—'}</TableCell>
              <TableCell>{e.ContainerNo || '—'}</TableCell>
              <TableCell>{e.LicensePlate || '—'}</TableCell>
              <TableCell>{e.Terminal || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function InventoryHistoryTable({ items }: { items: YardInventoryItem[] }) {
  if (items.length === 0) {
    return <EmptyState icon={Inbox} title="No history" description="No inventory history yet." />
  }
  return (
    <div className="overflow-auto max-h-[60vh] border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arrived</TableHead>
            <TableHead>Exited</TableHead>
            <TableHead>Chassis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Container</TableHead>
            <TableHead>Inbound Carrier</TableHead>
            <TableHead>Outbound Carrier</TableHead>
            <TableHead>Exit Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{formatDate(i.created_at)}</TableCell>
              <TableCell>{formatDate(i.actual_exit_at)}</TableCell>
              <TableCell className="font-mono">{i.chassis_number}</TableCell>
              <TableCell>
                <StatusBadge status={i.status} />
              </TableCell>
              <TableCell>{i.container_number || '—'}</TableCell>
              <TableCell>{i.inbound_carrier || '—'}</TableCell>
              <TableCell>{i.outbound_carrier || '—'}</TableCell>
              <TableCell>{i.exit_reason || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
