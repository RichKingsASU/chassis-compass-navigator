import { MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { dormancyBg, formatPT, daysSince } from './format'
import type { GpsPing } from './types'

interface Props {
  ping: GpsPing | null
  loading: boolean
}

export default function CurrentLocationCard({ ping, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Where is it now?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !ping ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No GPS data found for this chassis across any connected source.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {ping.source}
              </Badge>
              {(() => {
                const days = daysSince(ping.timestamp)
                return (
                  <Badge
                    variant="outline"
                    className={`text-xs ${dormancyBg(days)}`}
                  >
                    {days != null ? `${days}d since last movement` : 'No timestamp'}
                  </Badge>
                )
              })()}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Landmark</dt>
                <dd className="font-medium">{ping.landmark || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Address</dt>
                <dd className="font-medium">{ping.address || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Coordinates</dt>
                <dd className="font-mono text-xs">
                  {ping.lat != null && ping.lng != null
                    ? `${ping.lat.toFixed(5)}, ${ping.lng.toFixed(5)}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Last Ping</dt>
                <dd className="font-medium">{formatPT(ping.timestamp)}</dd>
              </div>
            </dl>
            <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center text-sm text-muted-foreground">
              {ping.lat != null && ping.lng != null
                ? 'Map — coordinates available'
                : 'Map — no coordinates from this source'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
