import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatUSD } from '@/features/dcli/format'
import type { DcliInternalLineItem } from '@/features/dcli/types'
import { statusColorClass } from './lineItemDerive'

interface LineItemStatusBreakdownProps {
  lineItems: DcliInternalLineItem[]
}

const STATUS_ORDER = ['Approved', 'Disputed', 'On Hold', 'Pending', 'Skipped', 'Not Set'] as const

export function LineItemStatusBreakdown({ lineItems }: LineItemStatusBreakdownProps) {
  const groups: Record<string, { count: number; amount: number }> = {}
  for (const status of STATUS_ORDER) groups[status] = { count: 0, amount: 0 }

  let totalAmount = 0
  for (const l of lineItems) {
    const key = l.line_item_status ?? 'Not Set'
    const bucket = groups[key] ?? groups['Not Set']
    bucket.count += 1
    const t = typeof l.total === 'number' ? l.total : 0
    bucket.amount += t
    totalAmount += t
  }

  const total = lineItems.length
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp size={16} /> Line Item Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {STATUS_ORDER.filter((s) => groups[s].count > 0).map((status) => {
            const colors = statusColorClass(status === 'Not Set' ? null : status)
            return (
              <div
                key={status}
                className={`h-full ${colors.bar} transition-all`}
                style={{ width: `${pct(groups[status].count)}%` }}
                title={`${status}: ${groups[status].count} (${pct(groups[status].count)}%)`}
              />
            )
          })}
        </div>

        <div className="space-y-1.5">
          {STATUS_ORDER.map((status) => {
            const { count, amount } = groups[status]
            if (count === 0) return null
            const colors = statusColorClass(status === 'Not Set' ? null : status)
            return (
              <div key={status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors.badge}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {count} ({pct(count)}%)
                  </span>
                  <span className="font-medium text-foreground">{formatUSD(amount)}</span>
                </div>
              </div>
            )
          })}
          {total === 0 && (
            <p className="text-sm text-muted-foreground">No line items.</p>
          )}
        </div>

        <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
          <span>{total} total line items</span>
          <span className="font-medium text-foreground">{formatUSD(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
