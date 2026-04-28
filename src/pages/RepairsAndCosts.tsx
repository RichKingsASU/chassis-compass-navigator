import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { Plus, Trash2, Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'

interface RepairRow {
  id: string
  chassis_number: string
  repair_date: string | null
  yard_id: string | null
  vendor: string | null
  description: string | null
  cost: number | null
  invoice_number: string | null
  repair_type: string | null
  created_by: string | null
  created_at: string | null
}

interface Yard {
  id: string
  name: string
  short_code: string | null
}

interface ChassisLessor {
  chassis_number: string
  lessor: string | null
}

const REPAIR_TYPES = [
  'PREVENTIVE',
  'CORRECTIVE',
  'INSPECTION',
  'TIRE',
  'BRAKE',
  'LIGHTING',
  'OTHER',
] as const

interface RepairFormData {
  chassisNumber: string
  repairDate: string
  repairType: string
  vendor: string
  description: string
  cost: string
  invoiceNumber: string
  yardId: string
}

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RepairsAndCosts() {
  const queryClient = useQueryClient()
  const [logOpen, setLogOpen] = React.useState(false)

  const { data: repairs, isLoading } = useQuery<RepairRow[]>({
    queryKey: ['chassis_repairs', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chassis_repairs')
        .select('*')
        .order('repair_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as RepairRow[]
    },
  })

  const { data: yards } = useQuery<Yard[]>({
    queryKey: ['yards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('yards').select('id, name, short_code')
      if (error) throw error
      return (data ?? []) as Yard[]
    },
  })

  const { data: chassisLessors } = useQuery<ChassisLessor[]>({
    queryKey: ['mcl_chassis', 'lessors_only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mcl_chassis')
        .select('chassis_number, lessor')
      if (error) throw error
      return (data ?? []) as ChassisLessor[]
    },
  })

  const lessorMap = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const c of chassisLessors ?? []) {
      if (c.chassis_number) m.set(c.chassis_number, c.lessor || '—')
    }
    return m
  }, [chassisLessors])

  const totalSpend = (repairs ?? []).reduce((s, r) => s + (r.cost || 0), 0)
  const startOfMonth = React.useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const repairsThisMonth = (repairs ?? []).filter((r) => {
    if (!r.repair_date) return false
    return new Date(r.repair_date) >= startOfMonth
  }).length
  const avgCost =
    (repairs ?? []).length > 0
      ? totalSpend / (repairs ?? []).filter((r) => r.cost != null).length || 0
      : 0
  const mostRepaired = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of repairs ?? []) {
      counts[r.chassis_number] = (counts[r.chassis_number] || 0) + 1
    }
    let max = 0
    let chassis = '—'
    for (const [k, v] of Object.entries(counts)) {
      if (v > max) {
        max = v
        chassis = k
      }
    }
    return { chassis, count: max }
  }, [repairs])

  const monthlyData = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of repairs ?? []) {
      if (!r.repair_date) continue
      const d = new Date(r.repair_date)
      if (isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = (map[key] || 0) + (r.cost || 0)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cost]) => ({ month, cost }))
  }, [repairs])

  const typeData = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of repairs ?? []) {
      const k = r.repair_type || 'OTHER'
      map[k] = (map[k] || 0) + (r.cost || 0)
    }
    return Object.entries(map).map(([type, cost]) => ({ type, cost }))
  }, [repairs])

  const insertMutation = useMutation({
    mutationFn: async (values: RepairFormData) => {
      const { error } = await supabase.from('chassis_repairs').insert({
        chassis_number: values.chassisNumber,
        repair_date: values.repairDate || null,
        repair_type: values.repairType || null,
        vendor: values.vendor || null,
        description: values.description || null,
        cost: values.cost ? parseFloat(values.cost) : null,
        invoice_number: values.invoiceNumber || null,
        yard_id: values.yardId || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Repair logged')
      queryClient.invalidateQueries({ queryKey: ['chassis_repairs'] })
      setLogOpen(false)
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chassis_repairs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Repair deleted')
      queryClient.invalidateQueries({ queryKey: ['chassis_repairs'] })
    },
    onError: (e: Error) => toast.error(`Delete failed: ${e.message}`),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repair &amp; Costs</h1>
          <p className="text-muted-foreground">Track chassis repair spend and history.</p>
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Repair
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground">Loading repairs…</div>
      ) : (repairs ?? []).length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repairs logged yet"
          description="Once you log a repair, costs and trends will appear here."
          actionLabel="Log Repair"
          onAction={() => setLogOpen(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Repair Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(totalSpend)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Repairs This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repairsThisMonth}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Cost / Repair
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(avgCost)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Most Repaired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{mostRepaired.chassis}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mostRepaired.count} repair(s)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spend</CardTitle>
                <CardDescription>Cost trend over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatMoney(v as number)} />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cost by Repair Type</CardTitle>
                <CardDescription>Total spend grouped by type</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="type" width={100} />
                    <Tooltip formatter={(v) => formatMoney(v as number)} />
                    <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Repair Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[60vh] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Lessor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(repairs ?? []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.repair_date)}</TableCell>
                        <TableCell className="font-mono">{r.chassis_number}</TableCell>
                        <TableCell>{lessorMap.get(r.chassis_number) || '—'}</TableCell>
                        <TableCell>{r.repair_type || '—'}</TableCell>
                        <TableCell>{r.vendor || '—'}</TableCell>
                        <TableCell className="max-w-xs truncate">{r.description || '—'}</TableCell>
                        <TableCell className="text-right">
                          {r.cost != null ? formatMoney(r.cost) : '—'}
                        </TableCell>
                        <TableCell>{r.invoice_number || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete repair for ${r.chassis_number}?`)) {
                                deleteMutation.mutate(r.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <LogRepairDialog
        open={logOpen}
        yards={yards ?? []}
        onClose={() => setLogOpen(false)}
        onSubmit={(v) => insertMutation.mutate(v)}
        loading={insertMutation.isPending}
      />
    </div>
  )
}

function LogRepairDialog({
  open,
  yards,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  yards: Yard[]
  onClose: () => void
  onSubmit: (values: RepairFormData) => void
  loading: boolean
}) {
  const [form, setForm] = React.useState<RepairFormData>({
    chassisNumber: '',
    repairDate: new Date().toISOString().slice(0, 10),
    repairType: 'CORRECTIVE',
    vendor: '',
    description: '',
    cost: '',
    invoiceNumber: '',
    yardId: '',
  })

  React.useEffect(() => {
    if (!open) {
      setForm({
        chassisNumber: '',
        repairDate: new Date().toISOString().slice(0, 10),
        repairType: 'CORRECTIVE',
        vendor: '',
        description: '',
        cost: '',
        invoiceNumber: '',
        yardId: '',
      })
    }
  }, [open])

  const canSubmit = form.chassisNumber && form.repairDate

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Repair</DialogTitle>
          <DialogDescription>Record a chassis repair event</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Chassis # *</Label>
            <Input
              value={form.chassisNumber}
              onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Repair Date *</Label>
            <Input
              type="date"
              value={form.repairDate}
              onChange={(e) => setForm({ ...form, repairDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Repair Type</Label>
            <Select
              value={form.repairType}
              onValueChange={(v) => setForm({ ...form, repairType: v })}
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
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Cost ($)</Label>
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
              value={form.invoiceNumber}
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Yard</Label>
            <Select value={form.yardId} onValueChange={(v) => setForm({ ...form, yardId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select yard (optional)" />
              </SelectTrigger>
              <SelectContent>
                {yards.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={loading || !canSubmit}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
