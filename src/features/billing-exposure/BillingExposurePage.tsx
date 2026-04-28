import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts'
import { TrendingUp, Filter, Download, Inbox } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { safeAmount } from '@/lib/formatters'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { exportToExcel } from '@/utils/exportUtils'
import { DataTable } from '@/components/shared/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { EmptyState } from '@/components/shared/EmptyState'

interface RevenueGapRow {
  period_month: string | null
  total_invoiced: number | null
  total_rated: number | null
  revenue_gap: number | null
}

interface ChartRow {
  period: string
  actual: number
  target: number
  gap: number
  projected: number
}

export default function BillingExposurePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  const searchFilter = searchParams.get('q') || ''

  const { data: realData, isLoading } = useQuery<RevenueGapRow[]>({
    queryKey: ['v_revenue_gap'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_revenue_gap').select('*')
      if (error) throw error
      return (data ?? []) as RevenueGapRow[]
    },
  })

  const chartData = React.useMemo<ChartRow[]>(() => {
    if (!realData || realData.length === 0) return []
    const grouped: Record<string, ChartRow> = {}
    for (const curr of realData) {
      const period = curr.period_month || 'Unknown'
      if (!grouped[period]) {
        grouped[period] = { period, actual: 0, target: 0, gap: 0, projected: 0 }
      }
      grouped[period].actual += curr.total_invoiced || 0
      grouped[period].target += curr.total_rated || 0
      grouped[period].gap += curr.revenue_gap || 0
      grouped[period].projected += (curr.total_invoiced || 0) + (curr.revenue_gap || 0) * 0.8
    }
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period))
  }, [realData])

  const columns: ColumnDef<ChartRow>[] = [
    {
      accessorKey: 'period',
      header: 'Period',
    },
    {
      accessorKey: 'target',
      header: 'Rated Revenue',
      cell: ({ row }) => <div className="text-right">{safeAmount(row.getValue('target'))}</div>,
    },
    {
      accessorKey: 'actual',
      header: 'Invoiced',
      cell: ({ row }) => (
        <div className="text-right text-green-600 font-medium">
          {safeAmount(row.getValue('actual'))}
        </div>
      ),
    },
    {
      accessorKey: 'gap',
      header: 'Gap Amount',
      cell: ({ row }) => (
        <div className="text-right text-destructive font-medium">
          {safeAmount(row.getValue('gap'))}
        </div>
      ),
    },
    {
      id: 'gapPercent',
      header: 'Gap %',
      cell: ({ row }) => {
        const gap = row.original.gap
        const target = row.original.target
        const pct = target > 0 ? (gap / target) * 100 : 0
        return <div className="text-right">{pct.toFixed(1)}%</div>
      },
    },
  ]

  const handleExport = () => {
    const selectedRows = chartData.filter((_, index) => rowSelection[index])
    const exportData = selectedRows.length > 0 ? selectedRows : chartData
    exportToExcel(exportData, `Revenue_Gap_${new Date().toISOString().split('T')[0]}`)
  }

  const totalGap = chartData.reduce((sum, item) => sum + item.gap, 0)
  const totalTarget = chartData.reduce((sum, item) => sum + item.target, 0)
  const totalActual = chartData.reduce((sum, item) => sum + item.actual, 0)
  const gapPercent = totalTarget > 0 ? (totalGap / totalTarget) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Gap Dashboard</h1>
          <p className="text-muted-foreground">
            Analyzing discrepancies between rated revenue and invoiced amounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={chartData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {Object.keys(rowSelection).length > 0
              ? `Export Selected (${Object.keys(rowSelection).length})`
              : 'Export All'}
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Loading revenue gap data…
        </div>
      ) : chartData.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No revenue gap data"
          description="No records returned from v_revenue_gap. Once invoiced and rated revenue records exist, metrics will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue Gap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{safeAmount(totalGap)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Across {chartData.length} period(s)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gap Percentage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gapPercent.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Target: &lt; 5%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Actual Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{safeAmount(totalActual)}</div>
                <p className="text-xs text-muted-foreground mt-1">Billed &amp; Processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projected Recovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{safeAmount(totalGap * 0.85)}</div>
                <p className="text-xs text-muted-foreground mt-1">Estimated recovery rate (85%)</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison</CardTitle>
                <CardDescription>Actual vs Projected Revenue by Period</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      formatter={(value) => safeAmount(value as number)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="actual"
                      name="Actual Revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="projected"
                      name="Projected Revenue"
                      fill="hsl(var(--muted-foreground))"
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Gap Trend</CardTitle>
                <CardDescription>Target vs Actual Revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => safeAmount(value as number)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="target"
                      name="Target Revenue"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorTarget)"
                    />
                    <Area
                      type="monotone"
                      dataKey="gap"
                      name="Revenue Gap"
                      stroke="hsl(var(--destructive))"
                      fillOpacity={1}
                      fill="url(#colorGap)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gap Analysis by Segment</CardTitle>
                  <CardDescription>Detailed breakdown of unbilled revenue sources.</CardDescription>
                </div>
                <Select defaultValue="region">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="manager">Account Manager</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={chartData}
                searchKey="period"
                searchValue={searchFilter}
                onSearchChange={(val) => {
                  if (val) {
                    setSearchParams({ q: val })
                  } else {
                    setSearchParams({})
                  }
                }}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </CardContent>

            <CardFooter className="justify-center border-t p-4">
              <Button variant="ghost" size="sm">
                View Detailed Report
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
}
