import { Anchor } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPT } from './format'
import type { PierSEventRow } from './types'

interface Props {
  rows: PierSEventRow[]
  loading: boolean
}

export default function PierSEventsCard({ rows, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Anchor className="h-4 w-4" />
          Pier S Terminal Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No Pier S terminal events found for this chassis.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => {
              const ts = r.EventDate
                ? `${r.EventDate}${r.EventTime ? ` ${r.EventTime}` : ''}`
                : null
              return (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2 text-xs"
                >
                  <span className="text-muted-foreground whitespace-nowrap">
                    {ts ? formatPT(ts) : '—'}
                  </span>
                  <span className="font-semibold">{r.EventDescription || '—'}</span>
                  {r.ContainerNo && (
                    <span className="font-mono text-muted-foreground">
                      {r.ContainerNo}
                    </span>
                  )}
                  {r.Terminal && (
                    <span className="ml-auto text-muted-foreground">{r.Terminal}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
