import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  CartesianGrid
} from 'recharts'
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  History, 
  DollarSign,
  BarChart3
} from 'lucide-react'
import type { VendorInvoice } from './VendorInvoicesTab'
import { formatCurrency } from '@/utils/dateUtils'

export interface VendorFinancialsTabProps {
  invoices: VendorInvoice[]
}

const COLORS = {
  PAID: '#10b981', // emerald-500
  OUTSTANDING: '#f59e0b', // amber-500
  MONTHLY: '#3b82f6', // blue-500
  AGING: '#f43f5e', // rose-500
}

function monthKey(dateStr: string): string {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

export function VendorFinancialsTab({ invoices }: VendorFinancialsTabProps) {
  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    for (const inv of invoices) {
      const key = monthKey(inv.invoice_date)
      map.set(key, (map.get(key) || 0) + Number(inv.invoice_amount || 0))
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }))
  }, [invoices])

  const paidVsOutstanding = useMemo(() => {
    let paid = 0
    let outstanding = 0
    for (const inv of invoices) {
      const amt = Number(inv.invoice_amount || 0)
      if ((inv.invoice_status || '').toLowerCase() === 'paid') paid += amt
      else outstanding += amt
    }
    return [
      { name: 'Paid', value: paid },
      { name: 'Outstanding', value: outstanding },
    ]
  }, [invoices])

  const aging = useMemo(() => {
    const buckets = { 'Current': 0, '1–30': 0, '31–60': 0, '61–90': 0, '90+': 0 }
    const today = new Date()
    for (const inv of invoices) {
      if ((inv.invoice_status || '').toLowerCase() === 'paid') continue
      if (!inv.due_date) continue
      const due = new Date(inv.due_date)
      if (Number.isNaN(due.getTime())) continue
      const overdue = daysBetween(today, due)
      const amt = Number(inv.invoice_amount || 0)
      if (overdue <= 0) buckets['Current'] += amt
      else if (overdue <= 30) buckets['1–30'] += amt
      else if (overdue <= 60) buckets['31–60'] += amt
      else if (overdue <= 90) buckets['61–90'] += amt
      else buckets['90+'] += amt
    }
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }))
  }, [invoices])

  const totalExposure = useMemo(() => paidVsOutstanding.reduce((s, r) => s + r.value, 0), [paidVsOutstanding])

  if (invoices.length === 0) {
    return (
      <Card className="border-none shadow-xl bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <PieChartIcon size={48} className="text-muted-foreground opacity-20" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Financial dataset unavailable</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="border-none shadow-xl bg-emerald-500/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Invoiced</p>
              <DollarSign size={14} className="text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-emerald-600">{formatCurrency(totalExposure)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-amber-500/[0.03]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">At Risk (Outstanding)</p>
              <TrendingUp size={14} className="text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-600">{formatCurrency(paidVsOutstanding[1].value)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend */}
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Expenditure Horizon
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border-2 shadow-2xl p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{payload[0].payload.month}</p>
                            <p className="text-xl font-black text-primary">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="amount" fill={COLORS.MONTHLY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Allocation */}
        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon size={18} className="text-primary" /> Capital Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={paidVsOutstanding} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    stroke="none"
                  >
                    <Cell fill={COLORS.PAID} />
                    <Cell fill={COLORS.OUTSTANDING} />
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border-2 shadow-2xl p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{payload[0].name}</p>
                            <p className="text-xl font-black">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Aging Buckets */}
        <Card className="border-none shadow-xl overflow-hidden lg:col-span-2">
          <CardHeader className="bg-muted/30 border-b py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History size={18} className="text-primary" /> Aging Velocity (Unpaid)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aging} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="bucket" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border-2 shadow-2xl p-4 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{payload[0].payload.bucket} Days</p>
                            <p className="text-xl font-black text-destructive">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="amount" fill={COLORS.AGING} radius={[0, 4, 4, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
