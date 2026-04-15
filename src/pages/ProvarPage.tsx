import { useMemo, useState } from 'react'
import { Plug, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { useProvar } from '@/hooks/useProvar'
import {
  PORTAL_LABELS,
  PROVAR_PORTALS,
  type ProvarContainerRow,
  type ProvarPortal,
  type ProvarPortalSummary,
  type ProvarSyncLogRow,
  type ProvarToReturnRow,
} from '@/types/provar'

const BASE_CONTAINER_KEYS = new Set([
  'Container #',
  'container_number',
  'container_id',
  'trade_type',
  'Trade Type',
  'line',
  'Line',
])

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Never'
  return d.toLocaleString()
}

function StatusBadge({ status }: { status: 'success' | 'error' | 'never' }) {
  if (status === 'success') {
    return (
      <Badge className="bg-green-600 hover:bg-green-600 text-white">OK</Badge>
    )
  }
  if (status === 'error') {
    return <Badge variant="destructive">Error</Badge>
  }
  return <Badge variant="secondary">Never</Badge>
}

function RawDataCell({ raw }: { raw: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          {open ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          {open ? 'Hide JSON' : 'Show JSON'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-2 max-w-md overflow-auto rounded bg-muted p-2 text-xs">
          {JSON.stringify(raw, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PortalSummaryCard({
  summary,
  isPulling,
  onPull,
}: {
  summary: ProvarPortalSummary
  isPulling: boolean
  onPull: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {PORTAL_LABELS[summary.portal]}
          </CardTitle>
          <StatusBadge status={summary.last_status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Containers</div>
            <div className="text-xl font-semibold">
              {summary.containers_count}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">To-Return</div>
            <div className="text-xl font-semibold">
              {summary.to_return_count}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Last pulled: {formatTimestamp(summary.last_pulled)}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={isPulling}
          onClick={onPull}
        >
          {isPulling ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Pulling...
            </>
          ) : (
            'Pull'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function ContainersTable({
  rows,
  portal,
}: {
  rows: ProvarContainerRow[]
  portal: ProvarPortal
}) {
  // Find extra keys across all raw_data objects beyond the mapped fields
  const extraKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const row of rows) {
      if (row.raw_data && typeof row.raw_data === 'object') {
        for (const k of Object.keys(row.raw_data)) {
          if (!BASE_CONTAINER_KEYS.has(k)) keys.add(k)
        }
      }
    }
    return Array.from(keys)
  }, [rows])

  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center border rounded-md">
        No container data for {PORTAL_LABELS[portal]} today. Click Pull to
        fetch.
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Container #</TableHead>
            <TableHead>Trade Type</TableHead>
            <TableHead>Line</TableHead>
            {extraKeys.map((k) => (
              <TableHead key={k}>{k}</TableHead>
            ))}
            <TableHead>Raw Data</TableHead>
            <TableHead>Snapshot Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs">
                {row.container_number ?? '—'}
              </TableCell>
              <TableCell>{row.trade_type ?? '—'}</TableCell>
              <TableCell>{row.line ?? '—'}</TableCell>
              {extraKeys.map((k) => {
                const val = row.raw_data?.[k]
                return (
                  <TableCell key={k} className="text-xs">
                    {val === null || val === undefined
                      ? '—'
                      : typeof val === 'object'
                        ? JSON.stringify(val)
                        : String(val)}
                  </TableCell>
                )
              })}
              <TableCell>
                <RawDataCell raw={row.raw_data} />
              </TableCell>
              <TableCell>{row.snapshot_date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ToReturnTable({
  rows,
  portal,
}: {
  rows: ProvarToReturnRow[]
  portal: ProvarPortal
}) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center border rounded-md">
        No to-return data for {PORTAL_LABELS[portal]} today.
      </div>
    )
  }
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Container ID</TableHead>
            <TableHead>Return Date</TableHead>
            <TableHead>Raw Data</TableHead>
            <TableHead>Snapshot Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs">
                {row.container_id ?? '—'}
              </TableCell>
              <TableCell>{row.return_date ?? '—'}</TableCell>
              <TableCell>
                <RawDataCell raw={row.raw_data} />
              </TableCell>
              <TableCell>{row.snapshot_date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SyncLogTable({ rows }: { rows: ProvarSyncLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center border rounded-md">
        No sync history yet.
      </div>
    )
  }
  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Portal</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rows Affected</TableHead>
            <TableHead>Error Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const rowClass =
              row.status === 'success'
                ? 'bg-green-50 dark:bg-green-950/30'
                : 'bg-red-50 dark:bg-red-950/30'
            return (
              <TableRow key={row.id} className={rowClass}>
                <TableCell className="text-xs">
                  {formatTimestamp(row.ran_at)}
                </TableCell>
                <TableCell>{row.portal}</TableCell>
                <TableCell>{row.endpoint}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.rows_affected}</TableCell>
                <TableCell className="text-xs max-w-md truncate">
                  {row.error_message ?? '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ProvarPage() {
  const {
    containers,
    toReturn,
    syncLog,
    portalSummaries,
    loading,
    isPulling,
    triggerPull,
  } = useProvar()
  const { toast } = useToast()
  const [logOpen, setLogOpen] = useState(false)

  const runPull = async (portals?: ProvarPortal[]) => {
    const result = await triggerPull(portals)
    if (!result) return
    const isError = result.errors > 0
    toast({
      title: isError ? 'Pull completed with errors' : 'Pull complete',
      description: `Rows: ${result.total_rows} · Errors: ${result.errors}`,
      variant: isError ? 'destructive' : 'default',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-7 w-7" />
            Provar Terminal Integration
          </h1>
          <p className="text-muted-foreground">
            Live container and return data from terminal portals
          </p>
        </div>
        <Button onClick={() => runPull()} disabled={isPulling}>
          {isPulling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Pulling...
            </>
          ) : (
            'Pull All Portals'
          )}
        </Button>
      </div>

      {/* Portal summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROVAR_PORTALS.map((p) => (
            <Skeleton key={p} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portalSummaries.map((summary) => (
            <PortalSummaryCard
              key={summary.portal}
              summary={summary}
              isPulling={isPulling}
              onPull={() => runPull([summary.portal])}
            />
          ))}
        </div>
      )}

      {/* Tabs per portal */}
      <Tabs defaultValue={PROVAR_PORTALS[0]} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto">
          {PROVAR_PORTALS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {PORTAL_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
        {PROVAR_PORTALS.map((portal) => {
          const portalContainers = containers.filter(
            (c) => c.portal === portal,
          )
          const portalToReturn = toReturn.filter((r) => r.portal === portal)
          return (
            <TabsContent key={portal} value={portal} className="space-y-6">
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Containers Sheet</h2>
                  <Badge variant="secondary">
                    {portalContainers.length} rows
                  </Badge>
                </div>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <ContainersTable rows={portalContainers} portal={portal} />
                )}
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">To Return</h2>
                  <Badge variant="secondary">
                    {portalToReturn.length} rows
                  </Badge>
                </div>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <ToReturnTable rows={portalToReturn} portal={portal} />
                )}
              </section>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Sync log */}
      <Collapsible open={logOpen} onOpenChange={setLogOpen}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Sync Log</CardTitle>
                  <Badge variant="secondary">{syncLog.length} entries</Badge>
                </div>
                {logOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <SyncLogTable rows={syncLog} />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
