import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DcliInternalLineItem } from '@/features/dcli/types'
import { deriveMatchBucket, deriveValidationStatus } from './lineItemDerive'

interface ActivityMatchSummaryProps {
  lineItems: DcliInternalLineItem[]
}

export function ActivityMatchSummary({ lineItems }: ActivityMatchSummaryProps) {
  const total = lineItems.length

  let matched = 0
  let fuzzy = 0
  let unmatched = 0

  let vPass = 0
  let vFail = 0
  let vWarn = 0
  let vSkipped = 0

  for (const l of lineItems) {
    const bucket = deriveMatchBucket(l)
    if (bucket === 'matched') matched++
    else if (bucket === 'fuzzy') fuzzy++
    else unmatched++

    const v = deriveValidationStatus(l)
    if (v === 'pass') vPass++
    else if (v === 'fail') vFail++
    else if (v === 'warn') vWarn++
    else vSkipped++
  }

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 size={16} /> Activity Match Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">No line items.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              {matched > 0 && (
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${pct(matched)}%` }}
                  title={`Matched: ${matched}`}
                />
              )}
              {fuzzy > 0 && (
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${pct(fuzzy)}%` }}
                  title={`Fuzzy: ${fuzzy}`}
                />
              )}
              {unmatched > 0 && (
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${pct(unmatched)}%` }}
                  title={`Unmatched: ${unmatched}`}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                {matched} matched
              </span>
              {' · '}
              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                {fuzzy} fuzzy
              </span>
              {' · '}
              <span className="text-red-700 dark:text-red-400 font-medium">
                {unmatched} unmatched
              </span>
              {' · '}
              <span className="text-foreground font-medium">{total} total</span>
            </p>
          </div>
        )}

        <div className="space-y-2 pt-3 border-t">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck size={12} /> Validation
          </p>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {vPass > 0 && (
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${pct(vPass)}%` }}
                    title={`Pass: ${vPass}`}
                  />
                )}
                {vWarn > 0 && (
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${pct(vWarn)}%` }}
                    title={`Warn: ${vWarn}`}
                  />
                )}
                {vFail > 0 && (
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${pct(vFail)}%` }}
                    title={`Fail: ${vFail}`}
                  />
                )}
                {vSkipped > 0 && (
                  <div
                    className="h-full bg-muted-foreground/40"
                    style={{ width: `${pct(vSkipped)}%` }}
                    title={`Skipped: ${vSkipped}`}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {vPass} pass
                </span>
                {' · '}
                <span className="text-red-700 dark:text-red-400 font-medium">
                  {vFail} fail
                </span>
                {' · '}
                <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                  {vWarn} warn
                </span>
                {' · '}
                <span>{vSkipped} skipped</span>
                {' · '}
                <span className="text-foreground font-medium">{total} total</span>
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
