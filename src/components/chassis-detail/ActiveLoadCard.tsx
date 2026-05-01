import { useState } from 'react'
import { Truck, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDatePT, daysSince } from './format'
import type { ActiveLoad, LoadRow } from './types'

interface Props {
  activeLoad: ActiveLoad | null
  loading: boolean
  recentLoads: LoadRow[]
}

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted hover:bg-muted/70 rounded-md text-xs font-mono"
    >
      {value}
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

export default function ActiveLoadCard({ activeLoad, loading, recentLoads }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-4 w-4" />
          What's it doing right now?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : !activeLoad ? (
          (() => {
            const lastLoad = recentLoads[0]
            const days = lastLoad ? daysSince(lastLoad.created_date) : null
            return (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                {lastLoad ? (
                  <>
                    No active load on record. Last load was{' '}
                    {days != null ? <strong>{days} days ago</strong> : '—'}
                    {' — '}
                    <span className="font-mono">{lastLoad.ld_num || '—'}</span>.
                  </>
                ) : (
                  'No active load on record.'
                )}
              </div>
            )
          })()
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {activeLoad.ld_num && <CopyChip value={activeLoad.ld_num} />}
              {activeLoad.so_num && <CopyChip value={activeLoad.so_num} />}
              {activeLoad.status && (
                <Badge variant="outline">{activeLoad.status}</Badge>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Field label="Customer" value={activeLoad.customer_name} />
              <Field label="Account Manager" value={activeLoad.acct_mg_name} />
              <Field label="Carrier" value={activeLoad.carrier_name} />
              <Field label="Service" value={activeLoad.service} />
              <Field
                label="Origin"
                value={[
                  activeLoad.pickup_loc_name,
                  [activeLoad.pickup_city, activeLoad.pickup_state]
                    .filter(Boolean)
                    .join(', ') || null,
                  activeLoad.pickup_actual_date
                    ? `Appt: ${formatDatePT(activeLoad.pickup_actual_date)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Field
                label="Destination"
                value={[
                  activeLoad.delivery_loc_name,
                  [activeLoad.delivery_city, activeLoad.delivery_state]
                    .filter(Boolean)
                    .join(', ') || null,
                  activeLoad.delivery_actual_date
                    ? `Appt: ${formatDatePT(activeLoad.delivery_actual_date)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Field
                label="Container"
                value={[activeLoad.container_number, activeLoad.container_type]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Field label="MBL" value={activeLoad.mbl} />
              <Field label="Steamship Line" value={activeLoad.steamshipline} />
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}

