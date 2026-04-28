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
import { Progress } from '@/components/ui/progress'
import { useProvar } from '@/hooks/useProvar'
import {
  PORTAL_LABELS,
  PROVAR_PORTALS,
  type ProvarContainerRow,
  type ProvarPortal,
  type ProvarPortalSummary,
  type ProvarSyncLogRow,
  type ProvarPullRun,
  type PullSummary,
} from '@/types/provar'


const BASE_CONTAINER_KEYS = new Set([
  'Container #',
  'container_number',
  'Trade Type',
  'trade_type',
  'Status',
  'status',
  'Line',
  'line',
  'Vessel Name',
  'vessel_name',
  'Last Free Day',
  'last_free_day',
  'Return Date',
  'return_date',
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
        <div>
          <div className="text-xs text-muted-foreground">Containers</div>
          <div className="text-2xl font-semibold">
            {summary.containers_count}
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
            <TableHead>Status</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Vessel Name</TableHead>
            <TableHead>Last Free Day</TableHead>
            <TableHead>Return Date</TableHead>
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
              <TableCell>{row.status ?? '—'}</TableCell>
              <TableCell>{row.line ?? '—'}</TableCell>
              <TableCell>{row.vessel_name ?? '—'}</TableCell>
              <TableCell>{row.last_free_day ?? '—'}</TableCell>
              <TableCell>{row.return_date ?? '—'}</TableCell>
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

function PullResultsCard({ summary }: { summary: PullSummary }) {
  const hasResults = summary.results && summary.results.length > 0

  if (!hasResults) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Last Pull Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Pull completed but no data was returned. Check that
            PROVAR_API_KEY is set in Supabase Edge Function secrets.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Last Pull Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portal</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.results.map((r, idx) => (
                <TableRow key={`${r.portal}-${r.endpoint}-${idx}`}>
                  <TableCell className="font-medium">{r.portal}</TableCell>
                  <TableCell>{r.endpoint}</TableCell>
                  <TableCell>{r.rows}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-xs max-w-md truncate text-destructive">
                    {r.error ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm">
          <span className="font-semibold">Total rows:</span>{' '}
          {summary.total_rows}
        </div>
        {summary.errors && summary.errors.length > 0 ? (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-destructive">
              Errors ({summary.errors.length}):
            </div>
            <ul className="list-disc pl-5 text-xs text-destructive space-y-1">
              {summary.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RunStatusPanel({ run }: { run: ProvarPullRun }) {
  const progress = run.total_containers > 0 
    ? Math.round((run.processed_containers / run.total_containers) * 100)
    : 0

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className={`h-4 w-4 ${run.status === 'running' ? 'animate-spin' : ''}`} />
            On-Demand Automation: {run.status.toUpperCase()}
          </CardTitle>
          <Badge variant={run.status === 'failed' ? 'destructive' : 'default'}>
            {run.processed_containers} / {run.total_containers} Containers
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="text-center p-2 rounded bg-background/50 border">
            <div className="text-xs text-muted-foreground">PDFs</div>
            <div className="text-xl font-bold">{run.downloaded_pdfs}</div>
          </div>
          <div className="text-center p-2 rounded bg-background/50 border">
            <div className="text-xs text-muted-foreground">Screenshots</div>
            <div className="text-xl font-bold">{run.downloaded_screenshots}</div>
          </div>
          <div className="text-center p-2 rounded bg-background/50 border">
            <div className="text-xs text-muted-foreground">Processed</div>
            <div className="text-xl font-bold text-primary">{run.processed_containers}</div>
          </div>
          <div className="text-center p-2 rounded bg-background/50 border">
            <div className="text-xs text-muted-foreground">Errors</div>
            <div className="text-xl font-bold text-destructive">{run.error_count}</div>
          </div>
        </div>

        {run.error_message && (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-xs font-mono border border-destructive/20">
            {run.error_message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProvarPage() {
  const {
    containers,
    syncLog,
    portalSummaries,
    loading,
    isPulling,
    lastPullResult,
    activeRun,
    triggerPull,
    startAutomationPull,
  } = useProvar()
  const { toast } = useToast()
  const [logOpen, setLogOpen] = useState(false)

  const runPull = async (portals?: ProvarPortal[]) => {
    try {
      if (!portals || portals.length === 0) {
        // Use new automation for "Pull All"
        await startAutomationPull()
        toast({
          title: 'Automation started',
          description: 'The background worker is now logging into Provar.',
        })
      } else {
        // Use legacy API for individual portals
        const result = await triggerPull(portals)
        const errorCount = result.errors?.length ?? 0
        const isError = errorCount > 0
        toast({
          title: isError ? 'Pull completed with errors' : 'Pull complete',
          description: `${result.total_rows} rows · ${errorCount} errors`,
          variant: isError ? 'destructive' : 'default',
        })
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Unknown error'
      toast({
        variant: 'destructive',
        title: 'Pull failed',
        description: msg,
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Plug className="h-7 w-7" />
            Provar Terminal Integration
          </h1>
          <p className="text-muted-foreground">
            Live container data from terminal portals
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

      {activeRun && <RunStatusPanel run={activeRun} />}

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

      {lastPullResult ? <PullResultsCard summary={lastPullResult} /> : null}

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
            </TabsContent>
          )
        })}
      </Tabs>

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
