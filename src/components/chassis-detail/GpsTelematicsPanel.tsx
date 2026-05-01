import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatPT, daysSince, dormancyBg } from './format'
import type { GpsPing } from './types'

interface SourceState {
  data: GpsPing[]
  loading: boolean
}

interface Props {
  bbTran: SourceState
  bbLog: SourceState
  fleetlocate: SourceState
  anytrek: SourceState
}

function GpsTable({
  pings,
  loading,
  source,
  showCoords,
}: {
  pings: GpsPing[]
  loading: boolean
  source: string
  showCoords: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-2 py-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  if (pings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No {source} data for this chassis.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Timestamp</TableHead>
            <TableHead className="text-xs">Landmark</TableHead>
            <TableHead className="text-xs">Address</TableHead>
            <TableHead className="text-xs">Coordinates</TableHead>
            <TableHead className="text-xs text-right">Days Dormant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pings.map((p, i) => {
            const days = daysSince(p.timestamp)
            return (
              <TableRow key={i}>
                <TableCell className="text-xs whitespace-nowrap">
                  {formatPT(p.timestamp)}
                </TableCell>
                <TableCell className="text-xs">{p.landmark || '—'}</TableCell>
                <TableCell className="text-xs">{p.address || '—'}</TableCell>
                <TableCell className="text-xs font-mono">
                  {!showCoords
                    ? 'N/A — join canonical_dataset'
                    : p.lat != null && p.lng != null
                    ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`
                    : '—'}
                </TableCell>
                <TableCell className={`text-xs text-right ${days != null && days > 30 ? 'text-rose-600 font-semibold' : ''}`}>
                  {days != null ? `${days}d` : '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function asNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return isNaN(n) ? null : n
}

function bbSourceShort(s: GpsPing['source']): string {
  if (s === 'BlackBerry TRAN') return 'TRAN'
  if (s === 'BlackBerry LOG') return 'LOG'
  return s
}

function BlackBerryTable({ pings, loading }: { pings: GpsPing[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2 py-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  if (pings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No BlackBerry data for this chassis.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Timestamp</TableHead>
            <TableHead className="text-xs">Geofence</TableHead>
            <TableHead className="text-xs">Lat</TableHead>
            <TableHead className="text-xs">Lon</TableHead>
            <TableHead className="text-xs">Event Type</TableHead>
            <TableHead className="text-xs">Container Mounted</TableHead>
            <TableHead className="text-xs text-right">Velocity</TableHead>
            <TableHead className="text-xs">Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pings.map((p, i) => {
            const eventType = (p.raw?.event_type as string | null) ?? null
            const containerMounted = p.raw?.container_mounted as boolean | null | undefined
            const velocity = asNum(p.raw?.velocity)
            return (
              <TableRow key={i}>
                <TableCell className="text-xs whitespace-nowrap">
                  {formatPT(p.timestamp)}
                </TableCell>
                <TableCell className="text-xs">{p.landmark || '—'}</TableCell>
                <TableCell className="text-xs font-mono">
                  {p.lat != null ? p.lat.toFixed(5) : '—'}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {p.lng != null ? p.lng.toFixed(5) : '—'}
                </TableCell>
                <TableCell className="text-xs">{eventType || '—'}</TableCell>
                <TableCell className="text-xs">
                  {containerMounted == null ? '—' : containerMounted ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-xs text-right">
                  {velocity != null ? velocity : '—'}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {bbSourceShort(p.source)}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SourceSummary({
  label,
  ts,
}: {
  label: string
  ts: string | null
}) {
  const days = daysSince(ts)
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      {ts ? (
        <Badge variant="outline" className={`text-xs ${dormancyBg(days)}`}>
          {formatPT(ts)} ({days != null ? `${days}d` : '—'})
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs text-slate-500">
          No data
        </Badge>
      )}
    </div>
  )
}

export default function GpsTelematicsPanel({
  bbTran,
  bbLog,
  fleetlocate,
  anytrek,
}: Props) {
  // Combined BlackBerry view (TRAN + LOG, sorted DESC)
  const bbCombined = [...bbTran.data, ...bbLog.data].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return tb - ta
  })

  const lastBb =
    bbCombined.length > 0 ? bbCombined[0].timestamp : null
  const lastFl = fleetlocate.data[0]?.timestamp ?? null
  const lastAt = anytrek.data[0]?.timestamp ?? null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          GPS / Telematics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="blackberry" className="space-y-3">
          <TabsList>
            <TabsTrigger value="blackberry">BlackBerry</TabsTrigger>
            <TabsTrigger value="fleetlocate">FleetLocate</TabsTrigger>
            <TabsTrigger value="anytrek">Anytrek</TabsTrigger>
          </TabsList>
          <TabsContent value="blackberry">
            <BlackBerryTable
              pings={bbCombined.slice(0, 10)}
              loading={bbTran.loading || bbLog.loading}
            />
          </TabsContent>
          <TabsContent value="fleetlocate">
            <GpsTable
              pings={fleetlocate.data}
              loading={fleetlocate.loading}
              source="FleetLocate"
              showCoords={false}
            />
          </TabsContent>
          <TabsContent value="anytrek">
            <GpsTable
              pings={anytrek.data}
              loading={anytrek.loading}
              source="Anytrek"
              showCoords
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            GPS Sources Summary
          </p>
          <div className="flex flex-wrap gap-3">
            <SourceSummary label="BlackBerry" ts={lastBb} />
            <SourceSummary label="FleetLocate" ts={lastFl} />
            <SourceSummary label="Anytrek" ts={lastAt} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
