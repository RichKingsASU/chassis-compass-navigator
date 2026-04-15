import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Clock, Copy, RefreshCw } from 'lucide-react'
import { useGpsSyncStatus } from '@/hooks/useGpsSyncStatus'

interface SyncProviderConfig {
  provider: string
  label: string
  description: string
}

const PROVIDERS: SyncProviderConfig[] = [
  {
    provider: 'blackberry_tran',
    label: 'BlackBerry Tran',
    description: 'MCC chassis fleet — 317 assets',
  },
  {
    provider: 'blackberry_log',
    label: 'BlackBerry Log',
    description: 'FRQZ chassis fleet — 50 assets',
  },
]

const SCRIPT_PATH =
  'C:\\__FORREST\\________Projects\\EquipmentCompass\\chassis-compass-navigator\\blackberry_radar_ingest.py'

function SyncProviderCard({
  config,
  stale,
  status,
}: {
  config: SyncProviderConfig
  stale: boolean
  status: ReturnType<ReturnType<typeof useGpsSyncStatus>['getStatus']>
}) {
  const [copied, setCopied] = useState(false)

  const command = `python "${SCRIPT_PATH}"`

  function copyCommand() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const lastSync = status?.completed_at
    ? new Date(status.completed_at).toLocaleString()
    : null

  const daysAgo = status?.days_since_sync
    ? Math.floor(status.days_since_sync)
    : null

  return (
    <Card className={stale ? 'border-amber-400' : 'border-green-400'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.label}</CardTitle>
          {stale ? (
            <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
              <AlertTriangle size={12} />
              Out of Sync
            </Badge>
          ) : (
            <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
              <CheckCircle size={12} />
              Up to Date
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted rounded p-2">
            <p className="text-lg font-bold">{status?.assets_found ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Assets</p>
          </div>
          <div className="bg-muted rounded p-2">
            <p className="text-lg font-bold">{status?.repair_found ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Repair Chassis</p>
          </div>
          <div className="bg-muted rounded p-2">
            <p className="text-lg font-bold">{status?.rows_inserted ?? '—'}</p>
            <p className="text-xs text-muted-foreground">Rows Loaded</p>
          </div>
        </div>

        {/* Last sync time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} />
          {lastSync
            ? `Last synced ${daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`} — ${lastSync}`
            : 'Never synced'}
        </div>

        {/* Sync command */}
        {stale && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-xs space-y-2">
              <p className="font-medium text-amber-800">Run this in your PowerShell terminal:</p>
              <div className="flex items-center gap-2 bg-white rounded border p-2">
                <code className="text-xs flex-1 break-all text-slate-700">
                  python "{SCRIPT_PATH}"
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={copyCommand}
                  title="Copy command"
                >
                  {copied ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export function GpsSyncPanel() {
  const { getStatus, isStale, loading, refetch } = useGpsSyncStatus()

  const anyStale = PROVIDERS.some(p => isStale(p.provider))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">BlackBerry API Sync</h2>
          <p className="text-sm text-muted-foreground">
            Data syncs via Python script run locally — click Copy to get the command
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </Button>
      </div>

      {anyStale && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle size={16} className="text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            One or more BlackBerry providers are out of sync. Open a PowerShell terminal
            and run the sync command below to pull the latest GPS data.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROVIDERS.map(config => (
          <SyncProviderCard
            key={config.provider}
            config={config}
            stale={isStale(config.provider)}
            status={getStatus(config.provider)}
          />
        ))}
      </div>
    </div>
  )
}
