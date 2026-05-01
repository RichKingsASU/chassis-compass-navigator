import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from './format'
import type { LoadRow } from './types'

interface Props {
  loads: LoadRow[]
  loading: boolean
}

interface MonthBucket {
  key: string
  label: string
  total: number
  count: number
  avg: number
}

function quartileColor(value: number, q1: number, q2: number, q3: number): string {
  if (value === 0) return '#cbd5e1'
  if (value >= q3) return '#16a34a' // green
  if (value >= q2) return '#84cc16' // lime
  if (value >= q1) return '#f59e0b' // amber
  return '#ef4444' // red
}

export default function RevenueHistoryChart({ loads, loading }: Props) {
  const { months, q1, q2, q3, topCustomers } = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 24)
    const buckets = new Map<string, MonthBucket>()
    const customerTotals = new Map<string, { total: number; count: number }>()

    for (const l of loads) {
      const d = l.created_date ? new Date(l.created_date) : null
      if (!d || isNaN(d.getTime())) continue
      const rev = Number(l.cust_rate_charge) || 0
      if (d >= cutoff) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = `${d.toLocaleString('en-US', {
          month: 'short',
          timeZone: 'America/Los_Angeles',
        })} '${String(d.getFullYear()).slice(-2)}`
        const existing = buckets.get(key) || { key, label, total: 0, count: 0, avg: 0 }
        existing.total += rev
        existing.count += 1
        buckets.set(key, existing)
      }
      const cust = l.customer_name || 'Unknown'
      const c = customerTotals.get(cust) || { total: 0, count: 0 }
      c.total += rev
      c.count += 1
      customerTotals.set(cust, c)
    }

    const orderedKeys: string[] = []
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      orderedKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const monthsArr: MonthBucket[] = orderedKeys.map((k) => {
      const b = buckets.get(k)
      const [year, month] = k.split('-')
      const dummy = new Date(Number(year), Number(month) - 1, 1)
      const label = `${dummy.toLocaleString('en-US', { month: 'short' })} '${String(dummy.getFullYear()).slice(-2)}`
      return b
        ? { ...b, avg: b.count ? b.total / b.count : 0 }
        : { key: k, label, total: 0, count: 0, avg: 0 }
    })

    const nonZero = monthsArr.map((m) => m.total).filter((v) => v > 0).sort((a, b) => a - b)
    const pct = (p: number) =>
      nonZero.length === 0 ? 0 : nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))]

    const top = Array.from(customerTotals.entries())
      .map(([name, v]) => ({ name, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return {
      months: monthsArr,
      q1: pct(0.25),
      q2: pct(0.5),
      q3: pct(0.75),
      topCustomers: top,
    }
  }, [loads])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Revenue History (24 months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0].payload as MonthBucket
                      return (
                        <div className="rounded border bg-background px-3 py-2 text-xs shadow">
                          <p className="font-semibold">{p.label}</p>
                          <p>Loads: {p.count}</p>
                          <p>Revenue: {formatCurrency(p.total)}</p>
                          <p>Avg: {formatCurrency(p.avg)}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="total">
                    {months.map((m, i) => (
                      <Cell key={i} fill={quartileColor(m.total, q1, q2, q3)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {topCustomers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Top customers by revenue
                </p>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs text-right">Loads</TableHead>
                        <TableHead className="text-xs text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((c) => (
                        <TableRow key={c.name}>
                          <TableCell className="text-xs">{c.name}</TableCell>
                          <TableCell className="text-xs text-right">{c.count}</TableCell>
                          <TableCell className="text-xs text-right">
                            {formatCurrency(c.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
