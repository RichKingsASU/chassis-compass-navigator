import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp } from 'lucide-react'
import { QueryEmptyState } from '@/components/ui/QueryEmptyState'
import { safeDate } from '@/lib/formatters'

interface BillingExposureRow {
  chassis_number: string
  reservation_number: string | null
  pick_up_location: string | null
  location_in: string | null
  date_out: string | null
  date_in: string | null
  vendor_billed_days: number | null
  computed_days: number | null
  days_delta: number | null
  pool_contract: string | null
  motor_carrier_scac: string | null
  market: string | null
  asset_type: string | null
  is_open: boolean
  days_accruing: number | null
}

export default function BillingExposurePage() {
  const [rows, setRows] = useState<BillingExposureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOpenOnly, setShowOpenOnly] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('v_billing_exposure')
          .select('*')
          .order('days_accruing', { ascending: false, nullsFirst: false })
          .limit(1000)

        if (showOpenOnly) query = query.eq('is_open', true)

        const { data, error: fetchErr } = await query
        if (fetchErr) throw fetchErr
        setRows((data || []) as BillingExposureRow[])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load billing exposure')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showOpenOnly])

  const openCount = rows.filter((r) => r.is_open).length
  const discrepancyCount = rows.filter(
    (r) => r.days_delta !== null && Math.abs(r.days_delta) >= 1,
  ).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Billing Exposure / Per-Diem Tracker</h1>
          <p className="text-muted-foreground">
            Open DCLI chassis accruing per-diem and vendor-vs-computed day discrepancies
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showOpenOnly}
              onChange={(e) => setShowOpenOnly(e.target.checked)}
              className="rounded"
            />
            Open chassis only
          </label>
          {openCount > 0 && <Badge variant="destructive">{openCount} open (accruing)</Badge>}
          {discrepancyCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <TrendingUp size={12} />
              {discrepancyCount} day discrepancies
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              Loading billing exposure...
            </div>
          ) : error ? (
            <QueryEmptyState
              reason="query_error"
              errorMessage={`${error} — verify v_billing_exposure view exists`}
              entityName="billing exposure rows"
            />
          ) : rows.length === 0 ? (
            <QueryEmptyState reason="no_data" entityName="billing exposure records" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead>Pickup Location</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead className="text-center">Vendor Days</TableHead>
                    <TableHead className="text-center">Computed Days</TableHead>
                    <TableHead className="text-center">Delta</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => {
                    const delta = row.days_delta
                    const hasDelta = delta !== null && Math.abs(delta) >= 1
                    const accruingHigh =
                      row.is_open && row.days_accruing !== null && row.days_accruing > 7
                    return (
                      <TableRow
                        key={`${row.chassis_number}-${i}`}
                        className={accruingHigh ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell className="font-mono text-sm">{row.chassis_number}</TableCell>
                        <TableCell className="text-sm">{row.pool_contract || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-700 max-w-[200px] truncate">
                          {row.pick_up_location || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{safeDate(row.date_out)}</TableCell>
                        <TableCell className="text-sm">
                          {row.date_in ? (
                            safeDate(row.date_in)
                          ) : (
                            <span className="text-red-600 font-medium">Open</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{row.vendor_billed_days ?? '—'}</TableCell>
                        <TableCell className="text-center">{row.computed_days ?? '—'}</TableCell>
                        <TableCell className="text-center">
                          {hasDelta ? (
                            <Badge
                              variant={delta! > 0 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {delta! > 0 ? `+${delta}` : delta}d
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {row.is_open ? (
                            <Badge variant="destructive" className="text-xs">
                              {row.days_accruing}d accruing
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-700">
                              Closed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
