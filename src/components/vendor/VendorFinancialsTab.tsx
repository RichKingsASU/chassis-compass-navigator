import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { VendorInvoice } from './VendorInvoicesTab'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

const tooltipFormatter = (value: unknown): string => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? formatCurrency(n) : ''
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

export interface VendorFinancialsTabProps {
  invoices: VendorInvoice[]
}

const PAID_COLOR = '#3b82f6'
const OUTSTANDING_COLOR = '#f59e0b'

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

  if (invoices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No invoice data available yet. Add invoices to see financial summaries.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Monthly Spend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="amount" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Paid vs Outstanding</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paidVsOutstanding} dataKey="value" nameKey="name" outerRadius={90} label={({ name }) => name}>
                <Cell fill={PAID_COLOR} />
                <Cell fill={OUTSTANDING_COLOR} />
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Aging Buckets (Outstanding)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={aging}>
              <XAxis dataKey="bucket" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="amount" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
