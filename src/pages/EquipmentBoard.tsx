import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowRightCircle, LogOut, Inbox } from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import ChassisDetailDrawer from '@/components/chassis/ChassisDetailDrawer'

interface Yard {
  id: string
  name: string
  short_code: string | null
  capacity: number | null
}

interface YardInventory {
  id: string
  yard_id: string
  chassis_number: string
  status: string | null
  container_number: string | null
  spot: string | null
  account_manager: string | null
  planned_exit_date: string | null
  inbound_carrier: string | null
  inbound_driver_name: string | null
  outbound_carrier: string | null
  exit_reason: string | null
  actual_exit_at: string | null
  reservation_notes: string | null
  created_at: string | null
  yards?: Yard | null
}

const STATUS_OPTIONS = ['EMPTY', 'LOADED', 'SHOP', 'RESERVED'] as const
const EXIT_REASONS = ['DISPATCHED', 'SHOP', 'OFFHIRE', 'TRANSFER'] as const

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'EMPTY':
      return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20">EMPTY</Badge>
    case 'LOADED':
      return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20">LOADED</Badge>
    case 'SHOP':
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20">SHOP</Badge>
    case 'RESERVED':
      return (
        <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/20">RESERVED</Badge>
      )
    default:
      return <Badge variant="outline">{s || 'Unknown'}</Badge>
  }
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysSince(d: string | null): number {
  if (!d) return 0
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24)))
}

interface AssignFormData {
  loadNumber: string
  containerNumber: string
  accountManager: string
  plannedExitDate: string
  driverName: string
  carrier: string
  notes: string
}

interface GateOutFormData {
  exitReason: string
  driverName: string
  plateOrCdl: string
  notes: string
}

interface AddInventoryFormData {
  yardId: string
  chassisNumber: string
  spot: string
  status: string
  containerNumber: string
  inboundCarrier: string
  driverName: string
  plateOrCdl: string
  accountManager: string
  notes: string
}

export default function EquipmentBoard() {
  const queryClient = useQueryClient()
  const [yardFilter, setYardFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedChassis, setSelectedChassis] = React.useState<string | null>(null)

  const [assignTarget, setAssignTarget] = React.useState<YardInventory | null>(null)
  const [gateOutTarget, setGateOutTarget] = React.useState<YardInventory | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const { data: yards } = useQuery<Yard[]>({
    queryKey: ['yards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('yards').select('*').eq('active', true)
      if (error) throw error
      return (data ?? []) as Yard[]
    },
  })

  const { data: inventory, isLoading } = useQuery<YardInventory[]>({
    queryKey: ['yard_inventory', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_inventory')
        .select('*, yards:yard_id(id, name, short_code, capacity)')
        .is('actual_exit_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as YardInventory[]
    },
  })

  const yardSummary = React.useMemo(() => {
    if (!yards) return []
    return yards.map((y) => {
      const items = (inventory ?? []).filter((i) => i.yard_id === y.id)
      const empty = items.filter((i) => (i.status || '').toUpperCase() === 'EMPTY').length
      const loaded = items.filter((i) => (i.status || '').toUpperCase() === 'LOADED').length
      const shop = items.filter((i) => (i.status || '').toUpperCase() === 'SHOP').length
      const utilization = y.capacity && y.capacity > 0 ? (items.length / y.capacity) * 100 : 0
      return { yard: y, empty, loaded, shop, total: items.length, utilization }
    })
  }, [yards, inventory])

  const filteredInventory = React.useMemo(() => {
    return (inventory ?? []).filter((i) => {
      if (yardFilter !== 'all' && i.yard_id !== yardFilter) return false
      if (statusFilter !== 'all' && (i.status || '').toUpperCase() !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matches =
          i.chassis_number.toLowerCase().includes(q) ||
          (i.container_number || '').toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })
  }, [inventory, yardFilter, statusFilter, search])

  const assignMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: AssignFormData
    }) => {
      const { error } = await supabase
        .from('yard_inventory')
        .update({
          status: 'LOADED',
          container_number: values.containerNumber || null,
          account_manager: values.accountManager || null,
          planned_exit_date: values.plannedExitDate || null,
          outbound_carrier: values.carrier || null,
          planned_driver_name: values.driverName || null,
          reservation_notes: values.notes || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis assigned to load')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      setAssignTarget(null)
    },
    onError: (e: Error) => toast.error(`Assign failed: ${e.message}`),
  })

  const gateOutMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GateOutFormData }) => {
      const { error } = await supabase
        .from('yard_inventory')
        .update({
          actual_exit_at: new Date().toISOString(),
          exit_reason: values.exitReason || null,
          exit_driver_name: values.driverName || null,
          exit_plate_cdl: values.plateOrCdl || null,
          reservation_notes: values.notes || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis gated out')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      setGateOutTarget(null)
    },
    onError: (e: Error) => toast.error(`Gate-out failed: ${e.message}`),
  })

  const addMutation = useMutation({
    mutationFn: async (values: AddInventoryFormData) => {
      const { error } = await supabase.from('yard_inventory').insert({
        yard_id: values.yardId,
        chassis_number: values.chassisNumber,
        spot: values.spot || null,
        status: values.status,
        container_number: values.containerNumber || null,
        inbound_carrier: values.inboundCarrier || null,
        inbound_driver_name: values.driverName || null,
        inbound_plate_cdl: values.plateOrCdl || null,
        account_manager: values.accountManager || null,
        reservation_notes: values.notes || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis added to yard')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      setAddOpen(false)
    },
    onError: (e: Error) => toast.error(`Add failed: ${e.message}`),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Board</h1>
          <p className="text-muted-foreground">
            Live yard inventory across all yards with gate-in/gate-out actions.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add to Yard
        </Button>
      </div>

      {yardSummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yardSummary.map(({ yard, empty, loaded, shop, total, utilization }) => (
            <Card key={yard.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{yard.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {total}/{yard.capacity ?? '∞'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Available</div>
                    <div className="text-xl font-bold text-green-600">{empty}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">In Use</div>
                    <div className="text-xl font-bold text-blue-600">{loaded}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Shop</div>
                    <div className="text-xl font-bold text-amber-600">{shop}</div>
                  </div>
                </div>
                <Progress value={Math.min(100, utilization)} />
                <div className="text-xs text-muted-foreground">
                  {utilization.toFixed(0)}% utilization
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Inventory</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search chassis or container"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[240px]"
              />
              <Select value={yardFilter} onValueChange={setYardFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Yard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Yards</SelectItem>
                  {(yards ?? []).map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading inventory…</div>
          ) : filteredInventory.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No yard inventory"
              description="No active inventory records. Use Add to Yard to log a chassis arrival."
              actionLabel="Add to Yard"
              onAction={() => setAddOpen(true)}
            />
          ) : (
            <div className="overflow-auto max-h-[60vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Yard</TableHead>
                    <TableHead>Spot</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>AM</TableHead>
                    <TableHead>Planned Exit</TableHead>
                    <TableHead>Days in Yard</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.yards?.name || '—'}</TableCell>
                      <TableCell>{i.spot || '—'}</TableCell>
                      <TableCell>
                        <button
                          className="font-mono font-medium text-primary hover:underline"
                          onClick={() => {
                            setSelectedChassis(i.chassis_number)
                            setDrawerOpen(true)
                          }}
                        >
                          {i.chassis_number}
                        </button>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={i.status} />
                      </TableCell>
                      <TableCell>{i.container_number || '—'}</TableCell>
                      <TableCell>{i.account_manager || '—'}</TableCell>
                      <TableCell>{formatDate(i.planned_exit_date)}</TableCell>
                      <TableCell>{daysSince(i.created_at)}d</TableCell>
                      <TableCell className="text-right space-x-1">
                        {(i.status || '').toUpperCase() === 'EMPTY' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAssignTarget(i)}
                          >
                            <ArrowRightCircle className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setGateOutTarget(i)}>
                          <LogOut className="h-4 w-4 mr-1" />
                          Gate Out
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignToLoadDialog
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSubmit={(values) => {
          if (assignTarget) assignMutation.mutate({ id: assignTarget.id, values })
        }}
        loading={assignMutation.isPending}
      />

      <GateOutDialog
        target={gateOutTarget}
        onClose={() => setGateOutTarget(null)}
        onSubmit={(values) => {
          if (gateOutTarget) gateOutMutation.mutate({ id: gateOutTarget.id, values })
        }}
        loading={gateOutMutation.isPending}
      />

      <AddToYardDialog
        open={addOpen}
        yards={yards ?? []}
        onClose={() => setAddOpen(false)}
        onSubmit={(values) => addMutation.mutate(values)}
        loading={addMutation.isPending}
      />

      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

function AssignToLoadDialog({
  target,
  onClose,
  onSubmit,
  loading,
}: {
  target: YardInventory | null
  onClose: () => void
  onSubmit: (values: AssignFormData) => void
  loading: boolean
}) {
  const [form, setForm] = React.useState<AssignFormData>({
    loadNumber: '',
    containerNumber: '',
    accountManager: '',
    plannedExitDate: '',
    driverName: '',
    carrier: '',
    notes: '',
  })

  React.useEffect(() => {
    if (target) {
      setForm({
        loadNumber: '',
        containerNumber: target.container_number || '',
        accountManager: target.account_manager || '',
        plannedExitDate: target.planned_exit_date || '',
        driverName: '',
        carrier: target.outbound_carrier || '',
        notes: '',
      })
    }
  }, [target])

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Load</DialogTitle>
          <DialogDescription>
            Chassis {target?.chassis_number} · {target?.yards?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Load #</Label>
            <Input
              value={form.loadNumber}
              onChange={(e) => setForm({ ...form, loadNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Container #</Label>
            <Input
              value={form.containerNumber}
              onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>AM Name</Label>
            <Input
              value={form.accountManager}
              onChange={(e) => setForm({ ...form, accountManager: e.target.value })}
            />
          </div>
          <div>
            <Label>Planned Exit Date</Label>
            <Input
              type="date"
              value={form.plannedExitDate}
              onChange={(e) => setForm({ ...form, plannedExitDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Driver</Label>
            <Input
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </div>
          <div>
            <Label>Carrier</Label>
            <Input
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={loading}>
            {loading ? 'Saving…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GateOutDialog({
  target,
  onClose,
  onSubmit,
  loading,
}: {
  target: YardInventory | null
  onClose: () => void
  onSubmit: (values: GateOutFormData) => void
  loading: boolean
}) {
  const [form, setForm] = React.useState<GateOutFormData>({
    exitReason: 'DISPATCHED',
    driverName: '',
    plateOrCdl: '',
    notes: '',
  })

  React.useEffect(() => {
    if (target) {
      setForm({ exitReason: 'DISPATCHED', driverName: '', plateOrCdl: '', notes: '' })
    }
  }, [target])

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gate Out</DialogTitle>
          <DialogDescription>
            Chassis {target?.chassis_number} · {target?.yards?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Exit Reason</Label>
            <Select
              value={form.exitReason}
              onValueChange={(v) => setForm({ ...form, exitReason: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXIT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Driver</Label>
            <Input
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Plate / CDL</Label>
            <Input
              value={form.plateOrCdl}
              onChange={(e) => setForm({ ...form, plateOrCdl: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={loading}>
            {loading ? 'Saving…' : 'Gate Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddToYardDialog({
  open,
  yards,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean
  yards: Yard[]
  onClose: () => void
  onSubmit: (values: AddInventoryFormData) => void
  loading: boolean
}) {
  const [form, setForm] = React.useState<AddInventoryFormData>({
    yardId: '',
    chassisNumber: '',
    spot: '',
    status: 'EMPTY',
    containerNumber: '',
    inboundCarrier: '',
    driverName: '',
    plateOrCdl: '',
    accountManager: '',
    notes: '',
  })
  const [chassisWarning, setChassisWarning] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setForm({
        yardId: '',
        chassisNumber: '',
        spot: '',
        status: 'EMPTY',
        containerNumber: '',
        inboundCarrier: '',
        driverName: '',
        plateOrCdl: '',
        accountManager: '',
        notes: '',
      })
      setChassisWarning(null)
    }
  }, [open])

  const validateChassis = async () => {
    if (!form.chassisNumber) {
      setChassisWarning(null)
      return
    }
    const { data, error } = await supabase
      .from('mcl_chassis')
      .select('chassis_number')
      .eq('chassis_number', form.chassisNumber)
      .maybeSingle()
    if (error) {
      setChassisWarning(null)
      return
    }
    setChassisWarning(data ? null : 'Chassis number not found in mcl_chassis. You can still save.')
  }

  const canSubmit = form.yardId && form.chassisNumber && form.status

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to Yard</DialogTitle>
          <DialogDescription>Log a chassis gate-in event</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Yard *</Label>
            <Select value={form.yardId} onValueChange={(v) => setForm({ ...form, yardId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select yard" />
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
          <div>
            <Label>Chassis # *</Label>
            <Input
              value={form.chassisNumber}
              onChange={(e) => setForm({ ...form, chassisNumber: e.target.value })}
              onBlur={validateChassis}
            />
            {chassisWarning && (
              <p className="text-xs text-amber-600 mt-1">{chassisWarning}</p>
            )}
          </div>
          <div>
            <Label>Spot</Label>
            <Input
              value={form.spot}
              onChange={(e) => setForm({ ...form, spot: e.target.value })}
            />
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Container #</Label>
            <Input
              value={form.containerNumber}
              onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Inbound Carrier</Label>
            <Input
              value={form.inboundCarrier}
              onChange={(e) => setForm({ ...form, inboundCarrier: e.target.value })}
            />
          </div>
          <div>
            <Label>Driver</Label>
            <Input
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </div>
          <div>
            <Label>Plate / CDL</Label>
            <Input
              value={form.plateOrCdl}
              onChange={(e) => setForm({ ...form, plateOrCdl: e.target.value })}
            />
          </div>
          <div>
            <Label>Account Manager</Label>
            <Input
              value={form.accountManager}
              onChange={(e) => setForm({ ...form, accountManager: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={loading || !canSubmit}>
            {loading ? 'Saving…' : 'Add to Yard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
