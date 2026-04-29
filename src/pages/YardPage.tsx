import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Warehouse } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import InventoryTable from '@/features/yard/components/InventoryTable'
import {
  AddToYardModal,
  type YardInventoryRow,
} from '@/features/yard/components/YardModals'
import { DirectionBadge } from '@/features/yard/statusBadge'
import { formatDate } from '@/utils/dateUtils'

type GateLogSource = 'jed' | 'pier_s' | 'inventory'

interface YardPageProps {
  yardShortCode: string
  yardLabel: string
  gateLogSource: GateLogSource
}

interface YardConfigRow {
  id: string
  name: string
  short_code: string
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  capacity: number
  daily_rate: number
}

interface JedEvent {
  id: number
  event_date: string | null
  event_time: string | null
  direction: string | null
  chassis_number_clean: string | null
  container_number: string | null
  driver_name: string | null
  carrier: string | null
  match_confidence: string | null
}

interface PierSEvent {
  id: number
  EventDate?: string | null
  event_date?: string | null
  ChassisNo?: string | null
  chassis_number?: string | null
  ContainerNo?: string | null
  container_number?: string | null
  Direction?: string | null
  direction?: string | null
  Driver?: string | null
  driver_name?: string | null
  Carrier?: string | null
  carrier?: string | null
  EventType?: string | null
  event_type?: string | null
}

export default function YardPage({ yardShortCode, yardLabel, gateLogSource }: YardPageProps) {
  const [addOpen, setAddOpen] = useState(false)

  const { data: yard, isLoading: yardLoading } = useQuery({
    queryKey: ['yard_config', yardShortCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select(
          'id, name, short_code, address_line1, city, state, zip, capacity, daily_rate'
        )
        .eq('short_code', yardShortCode)
        .maybeSingle()
      if (error) throw error
      return data as YardConfigRow | null
    },
  })

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['yard_inventory', 'page', yardShortCode, yard?.id],
    enabled: !!yard?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*')
        .eq('yard_id', yard!.id)
        .is('actual_exit_at', null)
        .order('date_in', { ascending: false })
      if (error) throw error
      return (data ?? []) as YardInventoryRow[]
    },
  })

  const { data: jedLog, isLoading: jedLoading } = useQuery({
    queryKey: ['jed_events', yardShortCode],
    enabled: gateLogSource === 'jed',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jed_yard_events')
        .select(
          'id, event_date, event_time, direction, chassis_number_clean, container_number, driver_name, carrier, match_confidence'
        )
        .not('chassis_number_clean', 'is', null)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as JedEvent[]
    },
  })

  const { data: pierLog, isLoading: pierLoading } = useQuery({
    queryKey: ['pier_s_events'],
    enabled: gateLogSource === 'pier_s',
    queryFn: async () => {
      const tryQuery = await supabase
        .from('yard_events_data')
        .select('*')
        .order('"EventDate"', { ascending: false })
        .limit(100)
      if (tryQuery.error) {
        const fallback = await supabase
          .from('yard_events_data')
          .select('*')
          .order('event_date', { ascending: false })
          .limit(100)
        if (fallback.error) throw fallback.error
        return (fallback.data ?? []) as PierSEvent[]
      }
      return (tryQuery.data ?? []) as PierSEvent[]
    },
  })

  const { data: invHistory, isLoading: invHistoryLoading } = useQuery({
    queryKey: ['yard_inventory', 'history', yardShortCode, yard?.id],
    enabled: gateLogSource === 'inventory' && !!yard?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*')
        .eq('yard_id', yard!.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as YardInventoryRow[]
    },
  })

  const yardLoadingAny = yardLoading || invLoading

  const gateLogContent = useMemo(() => {
    if (gateLogSource === 'jed') {
      if (jedLoading) return <Skeleton className="h-[300px] w-full" />
      const rows = jedLog ?? []
      if (rows.length === 0)
        return (
          <EmptyState
            title="No gate events"
            description="No JED gate events recorded yet."
          />
        )
      return (
        <div className="rounded-md border max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Chassis</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{formatDate(e.event_date)}</TableCell>
                  <TableCell>{e.event_time ?? '—'}</TableCell>
                  <TableCell>
                    <DirectionBadge direction={e.direction} />
                  </TableCell>
                  <TableCell className="font-mono">
                    {e.chassis_number_clean ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {e.container_number ?? '—'}
                  </TableCell>
                  <TableCell>{e.driver_name ?? '—'}</TableCell>
                  <TableCell>{e.carrier ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.match_confidence ?? '—'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }
    if (gateLogSource === 'pier_s') {
      if (pierLoading) return <Skeleton className="h-[300px] w-full" />
      const rows = pierLog ?? []
      if (rows.length === 0)
        return (
          <EmptyState
            title="No gate events"
            description="No Pier S gate events recorded yet."
          />
        )
      return (
        <div className="rounded-md border max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Chassis</TableHead>
                <TableHead>Container</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Carrier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => {
                const dateVal = e.EventDate ?? e.event_date ?? null
                const dir =
                  e.Direction ?? e.direction ?? e.EventType ?? e.event_type ?? null
                const chassis = e.ChassisNo ?? e.chassis_number ?? null
                const container = e.ContainerNo ?? e.container_number ?? null
                const driver = e.Driver ?? e.driver_name ?? null
                const carrier = e.Carrier ?? e.carrier ?? null
                return (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(dateVal)}</TableCell>
                    <TableCell>
                      <DirectionBadge direction={dir} />
                    </TableCell>
                    <TableCell className="font-mono">{chassis ?? '—'}</TableCell>
                    <TableCell className="font-mono">{container ?? '—'}</TableCell>
                    <TableCell>{driver ?? '—'}</TableCell>
                    <TableCell>{carrier ?? '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )
    }
    if (invHistoryLoading) return <Skeleton className="h-[300px] w-full" />
    const rows = invHistory ?? []
    if (rows.length === 0)
      return (
        <EmptyState
          title="No history"
          description="No inventory history recorded for this yard yet."
        />
      )
    return (
      <div className="rounded-md border max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Recorded</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Chassis</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Carrier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isExited = !!r.actual_exit_at
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    {formatDate(isExited ? r.actual_exit_at : r.created_at ?? r.date_in)}
                  </TableCell>
                  <TableCell>
                    <DirectionBadge direction={isExited ? 'OUT' : 'IN'} />
                  </TableCell>
                  <TableCell className="font-mono">{r.chassis_number}</TableCell>
                  <TableCell className="font-mono">
                    {r.container_number ?? '—'}
                  </TableCell>
                  <TableCell>
                    {(isExited ? null : r.inbound_driver_name) ??
                      r.planned_driver_name ??
                      '—'}
                  </TableCell>
                  <TableCell>
                    {(isExited ? r.outbound_carrier : r.inbound_carrier) ?? '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }, [
    gateLogSource,
    jedLog,
    jedLoading,
    pierLog,
    pierLoading,
    invHistory,
    invHistoryLoading,
  ])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Warehouse className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">{yardLabel}</h1>
            <p className="text-muted-foreground mt-2">
              Live yard inventory and gate event log
            </p>
          </div>
        </div>
        {yard && (
          <Button onClick={() => setAddOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add to Yard
          </Button>
        )}
      </div>

      {yardLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !yard ? (
        <EmptyState
          title="Yard not configured"
          description={`Yard "${yardShortCode}" is missing from the yards table. Seed it via Supabase.`}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{yard.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Address</div>
              <div>
                {[yard.address_line1, yard.city, yard.state, yard.zip]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Capacity</div>
              <div className="font-semibold">{yard.capacity}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Daily Rate</div>
              <div className="font-semibold">${Number(yard.daily_rate).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Short Code</div>
              <div className="font-mono font-semibold">{yard.short_code}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {yardLoadingAny ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <InventoryTable rows={inventory ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gate Event Log</CardTitle>
        </CardHeader>
        <CardContent>{gateLogContent}</CardContent>
      </Card>

      <AddToYardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultYardId={yard?.id}
      />
    </div>
  )
}
