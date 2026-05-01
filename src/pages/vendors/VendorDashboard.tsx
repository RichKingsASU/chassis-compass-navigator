import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendorExposure, type VendorExposureRow } from '@/hooks/useVendorExposure'
import {
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Wallet,
  Clock,
  ArrowRight,
} from 'lucide-react'

type VendorKey = 'TRAC' | 'DCLI' | 'CCM' | 'FLEXIVAN' | 'SCSPA' | 'WCCP'

const VENDOR_COLORS: Record<VendorKey, { dot: string; bar: string; progress: string }> = {
  TRAC: { dot: 'bg-blue-500', bar: 'bg-blue-500', progress: 'bg-blue-500' },
  DCLI: { dot: 'bg-green-500', bar: 'bg-green-500', progress: 'bg-green-500' },
  CCM: { dot: 'bg-purple-500', bar: 'bg-purple-500', progress: 'bg-purple-500' },
  FLEXIVAN: { dot: 'bg-orange-500', bar: 'bg-orange-500', progress: 'bg-orange-500' },
  SCSPA: { dot: 'bg-teal-500', bar: 'bg-teal-500', progress: 'bg-teal-500' },
  WCCP: { dot: 'bg-gray-500', bar: 'bg-gray-500', progress: 'bg-gray-500' },
}

function getVendorColor(vendor: string | null): { dot: string; bar: string; progress: string } {
  const key = (vendor ?? '').toUpperCase() as VendorKey
  return VENDOR_COLORS[key] ?? { dot: 'bg-gray-400', bar: 'bg-gray-400', progress: 'bg-gray-400' }
}

function formatLargeMoney(value: number): string {
  if (!isFinite(value)) return '$0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function n(v: number | null | undefined): number {
  return typeof v === 'number' && isFinite(v) ? v : 0
}

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  accent?: 'default' | 'amber' | 'red'
}

function KpiCard({ label, value, icon, accent = 'default' }: KpiCardProps) {
  const valueColor =
    accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-foreground'
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </p>
            <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface VendorCardProps {
  row: VendorExposureRow
  totalBilledAll: number
}

function VendorCard({ row, totalBilledAll }: VendorCardProps) {
  const navigate = useNavigate()
  const vendorName = (row.vendor ?? '').toUpperCase()
  const slug = vendorName.toLowerCase()
  const colors = getVendorColor(vendorName)
  const totalBilled = n(row.total_billed)
  const share = totalBilledAll > 0 ? Math.min(100, (totalBilled / totalBilledAll) * 100) : 0
  const goDetails = () => navigate(`/vendors/${slug}`)

  return (
    <Card
      onClick={goDetails}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
            {vendorName || 'Unknown'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatLargeMoney(totalBilled)}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {n(row.chassis_count).toLocaleString('en-US')} chassis ·{' '}
          {n(row.line_items).toLocaleString('en-US')} line items ·{' '}
          {n(row.avg_bill_days).toFixed(1)} avg days
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full ${colors.progress}`}
            style={{ width: `${share}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {n(row.disputed_count) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
              {n(row.disputed_count)} disputes · {formatLargeMoney(n(row.disputed_amount))}
            </span>
          )}
          {n(row.open_balance) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 border border-red-200">
              Open: {formatMoney(n(row.open_balance))}
            </span>
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goDetails()
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View Details <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function VendorDashboard() {
  const { vendors, loading, error } = useVendorExposure()

  const totals = useMemo(() => {
    const totalBilled = vendors.reduce((s, v) => s + n(v.total_billed), 0)
    const totalDisputes = vendors.reduce((s, v) => s + n(v.disputed_count), 0)
    const totalDisputedAmount = vendors.reduce((s, v) => s + n(v.disputed_amount), 0)
    const totalOpen = vendors.reduce((s, v) => s + n(v.open_balance), 0)
    const weightedDaysNum = vendors.reduce(
      (s, v) => s + n(v.avg_bill_days) * n(v.line_items),
      0,
    )
    const weightedDaysDen = vendors.reduce((s, v) => s + n(v.line_items), 0)
    const avgDwell = weightedDaysDen > 0 ? weightedDaysNum / weightedDaysDen : 0
    return { totalBilled, totalDisputes, totalDisputedAmount, totalOpen, avgDwell }
  }, [vendors])

  const chartData = useMemo(
    () =>
      vendors.map((v) => ({
        vendor: (v.vendor ?? '').toUpperCase(),
        billed: n(v.total_billed),
        disputed: n(v.disputed_amount),
        open: n(v.open_balance),
      })),
    [vendors],
  )

  const tableRows = useMemo(
    () => [...vendors].sort((a, b) => n(b.total_billed) - n(a.total_billed)),
    [vendors],
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipment Vendor Dashboard</h1>
        <p className="text-muted-foreground">Per-diem billing across all chassis vendors</p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-red-600">Failed to load vendor exposure: {error}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Total Billed"
            value={formatLargeMoney(totals.totalBilled)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <KpiCard
            label="Total Disputes"
            value={totals.totalDisputes.toLocaleString('en-US')}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="amber"
          />
          <KpiCard
            label="Total Disputed $"
            value={formatLargeMoney(totals.totalDisputedAmount)}
            icon={<AlertCircle className="h-5 w-5" />}
            accent="red"
          />
          <KpiCard
            label="Open Balance"
            value={formatMoney(totals.totalOpen)}
            icon={<Wallet className="h-5 w-5" />}
            accent="red"
          />
          <KpiCard
            label="Avg Dwell Days"
            value={`${totals.avgDwell.toFixed(1)}`}
            icon={<Clock className="h-5 w-5" />}
            accent="amber"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {vendors.map((row) => (
            <VendorCard
              key={row.vendor ?? Math.random()}
              row={row}
              totalBilledAll={totals.totalBilled}
            />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Billing Breakdown by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="vendor" />
                  <YAxis tickFormatter={(value: number) => formatLargeMoney(value)} width={70} />
                  <Tooltip
                    formatter={(value: number | string) =>
                      formatMoney(typeof value === 'number' ? value : Number(value) || 0)
                    }
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="billed"
                    name="Total Billed"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="disputed"
                    name="Disputed Amount"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="open"
                    name="Open Balance"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Rate by Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Vendor</th>
                    <th className="px-3 py-2 text-right font-medium">Total Billed</th>
                    <th className="px-3 py-2 text-right font-medium">Disputes</th>
                    <th className="px-3 py-2 text-right font-medium">Disputed $</th>
                    <th className="px-3 py-2 text-right font-medium">Dispute Rate %</th>
                    <th className="px-3 py-2 text-right font-medium">Avg Days</th>
                    <th className="px-3 py-2 text-right font-medium">Last Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const billed = n(row.total_billed)
                    const disputed = n(row.disputed_amount)
                    const rate = billed > 0 ? (disputed / billed) * 100 : 0
                    const vendorName = (row.vendor ?? '').toUpperCase()
                    const colors = getVendorColor(vendorName)
                    return (
                      <tr key={row.vendor ?? Math.random()} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                            {vendorName}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatMoney(billed)}
                        </td>
                        <td className="px-3 py-2 text-right">{n(row.disputed_count)}</td>
                        <td className="px-3 py-2 text-right">{formatMoney(disputed)}</td>
                        <td className="px-3 py-2 text-right">{rate.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right">
                          {n(row.avg_bill_days).toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatMonthYear(row.latest_invoice)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
