import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDatePT } from './format'
import type { AxleSwapFlag } from './types'

interface Props {
  flag: AxleSwapFlag | null
  loading: boolean
}

export default function AxleSwapFlagCard({ flag, loading }: Props) {
  if (loading) {
    return <Skeleton className="h-20 w-full" />
  }
  if (!flag) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        <ShieldCheck className="h-3.5 w-3.5" />
        No axle swap flag
      </div>
    )
  }
  return (
    <Card className="border-rose-300 bg-rose-50">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
          <AlertTriangle className="h-4 w-4" />
          Axle swap flag — GPS evidence of presence at blacklisted yard
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-rose-700/70">Yard</dt>
            <dd className="font-medium text-rose-900">{flag.yard_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-rose-700/70">Address</dt>
            <dd className="font-medium text-rose-900">{flag.yard_address || '—'}</dd>
          </div>
          <div>
            <dt className="text-rose-700/70">Dwell</dt>
            <dd className="font-medium text-rose-900">
              {flag.dwell_days != null ? `${flag.dwell_days} days` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-rose-700/70">Detected</dt>
            <dd className="font-medium text-rose-900">{formatDatePT(flag.detection_date)}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-rose-700/80 italic">
          Cross-reference with TMS carrier data pending.
        </p>
      </CardContent>
    </Card>
  )
}
