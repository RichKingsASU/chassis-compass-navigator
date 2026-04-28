import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
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
} from 'recharts'
import { Wrench, DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/utils/dateUtils'

interface RepairRow {
  id: string
  chassis_number: string
  repair_date: string
  repair_type: string
  description: string | null
  vendor: string | null
  cost: number
  invoice_number: string | null
  yard: string | null
  created_at: string
}

interface YardOption {
  id: string
  name: string
  short_code: string
}

const REPAIR_TYPES = [
  'TIRE',
  'BRAKES',
  'AXLE',
  'LIGHTS',
  'ELECTRICAL',
  'PAINT',
  'FRAME',
  'WHEEL',
  'INSPECTION',
  'OTHER',
]

function LogRepairModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    chassis_number: '',
    repair_date: new Date().toISOString().slice(0, 10),
    repair_type: 'TIRE',
    vendor: '',
    description: '',
    cost: '',
    invoice_number: '',
    yard: '',
  })

  const { data: yards } = useQuery({
    queryKey: ['yards_list_modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select('id, name, short_code')
        .order('name')
      if (error) throw error
      return (data ?? []) as YardOption[]
    },
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const chassis = form.chassis_number.trim().toUpperCase()
      if (!chassis) throw new Error('Chassis # is required')
      const { data: chk, error: chkErr } = await supabase
        .from('mcl_chassis')
        .select('chassis_number')
        .eq('chassis_number', chassis)
        .maybeSingle()
      if (chkErr) throw chkErr
      if (!chk) throw new Error(`Chassis ${chassis} not found in MCL fleet`)

      const cost = Number.parseFloat(form.cost)
      if (Number.isNaN(cost) || cost < 0) throw new Error('Cost must be a positive number')

      const { error } = await supabase.from('chassis_repairs').insert({
        chassis_number: chassis,
        repair_date: form.repair_date,
        repair_type: form.repair_type,
        description: form.description || null,
        vendor: form.vendor || null,
        cost,
        invoice_number: form.invoice_number || null,
        yard: form.yard || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Repair logged')
      queryClient.invalidateQueries({ queryKey: ['chassis_repairs'] })
      onClose()
      setForm({
        chassis_number: '',
        repair_date: new Date().toISOString().slice(0, 10),
        repair_type: 'TIRE',
        vendor: '',
        description: '',
        cost: '',
        invoice_number: '',
        yard: '',
      })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Repair</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Chassis # *</Label>
              <Input
                value={form.chassis_number}
                onChange={(e) =>
                  setForm({ ...form, chassis_number: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <Label>Repair Date *</Label>
              <Input
                type="date"
                value={form.repair_date}
                onChange={(e) => setForm({ ...form, repair_date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Repair Type *</Label>
              <Select
                value={form.repair_type}
                onValueChange={(v) => setForm({ ...form, repair_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPAIR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vendor</Label>
              <Input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cost ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
            <div>
              <Label>Invoice #</Label>
              <Input
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Yard</Label>
              <Select
                value={form.yard}
                onValueChange={(v) => setForm({ ...form, yard: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(yards ?? []).map((y) => (
                    <SelectItem key={y.id} value={y.short_code}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save Repair'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function RepairsAndCosts() {
  const [logOpen, setLogOpen] = useState(false)

  const { data: repairs, isLoading } = useQuery({
    queryKey: ['chassis_repairs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chassis_repairs')
        .select('*')
        .order('repair_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as RepairRow[]
    },
  })

  const { data: lessorMap } = useQuery({
    queryKey: ['mcl_lessor_map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcl_chassis')
        .select('chassis_number, lessor')
      if (error) throw error
      const map: Record<string, string> = {}
      ;(data ?? []).forEach((r: { chassis_number: string; lessor: string | null }) => {
        if (r.lessor) map[r.chassis_number.trim()] = r.lessor
      })
      return map
    },
  })

  const kpis = useMemo(() => {
    const list = repairs ?? []
    const total = list.reduce((s, r) => s + Number(r.cost || 0), 0)
    const avg = list.length > 0 ? total / list.length : 0
    const startMonth = startOfMonth(new Date())
    const thisMonth = list.filter((r) => {
      try {
        return parseISO(r.repair_date).getTime() >= startMonth.getTime()
      } catch {
        return false
      }
    }).length

    const counts = new Map<string, number>()
    list.forEach((r) => counts.set(r.chassis_number, (counts.get(r.chassis_number) || 0) + 1))
    let mostRepaired: string | null = null
    let max = 0
    counts.forEach((c, k) => {
      if (c > max) {
        max = c
        mostRepaired = k
      }
    })

    return { total, avg, thisMonth, mostRepaired, mostRepairedCount: max }
  }, [repairs])

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    ;(repairs ?? []).forEach((r) => {
      try {
        const key = format(parseISO(r.repair_date), 'yyyy-MM')
        map.set(key, (map.get(key) || 0) + Number(r.cost || 0))
      } catch {
        /* skip */
      }
    })
    return Array.from(map, ([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({
        month: format(parseISO(`${r.month}-01`), 'MMM yyyy'),
        total: Math.round(r.total * 100) / 100,
      }))
  }, [repairs])

  const typeData = useMemo(() => {
    const map = new Map<string, number>()
    ;(repairs ?? []).forEach((r) => {
      map.set(r.repair_type, (map.get(r.repair_type) || 0) + Number(r.cost || 0))
    })
    return Array.from(map, ([type, total]) => ({
      type,
      total: Math.round(total * 100) / 100,
    })).sort((a, b) => b.total - a.total)
  }, [repairs])

  const kpiCards = [
    {
      label: 'Total Repair Spend',
      value: formatCurrency(kpis.total),
      icon: DollarSign,
    },
    {
      label: 'Avg Cost / Repair',
      value: formatCurrency(kpis.avg),
      icon: TrendingUp,
    },
    {
      label: 'Repairs This Month',
      value: kpis.thisMonth.toLocaleString(),
      icon: Calendar,
    },
    {
      label: 'Most Repaired Chassis',
      value: kpis.mostRepaired
        ? `${kpis.mostRepaired} (${kpis.mostRepairedCount})`
        : '—',
      icon: Wrench,
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wrench className="h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold">Repair & Costs</h1>
            <p className="text-muted-foreground mt-2">
              Repair history and cost analytics across the MCL fleet
            </p>
          </div>
        </div>
        <Button onClick={() => setLogOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Log Repair
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <k.icon className="h-3.5 w-3.5" />
                {k.label}
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{k.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Repair Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repair data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Area dataKey="total" stroke="#2563eb" fill="#2563eb33" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repair Cost by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : typeData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repair data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="type" width={100} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="total" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (repairs ?? []).length === 0 ? (
            <EmptyState
              title="No repairs logged"
              description="Click 'Log Repair' to record the first repair."
              actionLabel="Log Repair"
              onAction={() => setLogOpen(true)}
            />
          ) : (
            <div className="rounded-md border max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Lessor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Invoice #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(repairs ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{formatDate(r.repair_date)}</TableCell>
                      <TableCell className="font-mono">{r.chassis_number}</TableCell>
                      <TableCell>{lessorMap?.[r.chassis_number.trim()] ?? '—'}</TableCell>
                      <TableCell>{r.repair_type}</TableCell>
                      <TableCell className="max-w-[280px] truncate">
                        {r.description ?? '—'}
                      </TableCell>
                      <TableCell>{r.vendor ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(r.cost))}
                      </TableCell>
                      <TableCell>{r.invoice_number ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LogRepairModal open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}
