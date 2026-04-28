import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

export interface YardInventoryRow {
  id: string
  yard_id: string
  date_in: string | null
  time_in: string | null
  container_number: string | null
  chassis_number: string
  status: string | null
  spot: string | null
  chassis_type: string | null
  account_manager: string | null
  inbound_carrier: string | null
  inbound_driver_name: string | null
  planned_exit_date: string | null
  planned_driver_name: string | null
  outbound_carrier: string | null
  reservation_notes: string | null
  shop_reason: string | null
  actual_exit_at: string | null
  created_at?: string | null
}

export interface YardOption {
  id: string
  name: string
  short_code: string
}

const ACCOUNT_MANAGERS = [
  'CROCS TEAM',
  'EFL TEAM',
  'LEO',
  'BRIANA',
  'SAM P.',
  'CARLOS M.',
  'OTHER',
]

export function AssignToLoadModal({
  target,
  onClose,
}: {
  target: YardInventoryRow | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    load_number: '',
    container_number: '',
    account_manager: '',
    planned_exit_date: '',
    planned_driver_name: '',
    outbound_carrier: '',
    reservation_notes: '',
  })

  useEffect(() => {
    if (target) {
      setForm({
        load_number: '',
        container_number: target.container_number ?? '',
        account_manager: target.account_manager ?? '',
        planned_exit_date: target.planned_exit_date ?? '',
        planned_driver_name: target.planned_driver_name ?? '',
        outbound_carrier: target.outbound_carrier ?? '',
        reservation_notes: target.reservation_notes ?? '',
      })
    }
  }, [target])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error('No target')
      const notes = [
        form.load_number ? `Load #: ${form.load_number}` : null,
        form.reservation_notes || null,
      ]
        .filter(Boolean)
        .join(' | ')
      const update = {
        status: 'LOADED',
        container_number: form.container_number || null,
        account_manager: form.account_manager || null,
        planned_exit_date: form.planned_exit_date || null,
        planned_driver_name: form.planned_driver_name || null,
        outbound_carrier: form.outbound_carrier || null,
        reservation_notes: notes || null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('yard_inventory')
        .update(update)
        .eq('id', target.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis assigned to load')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      queryClient.invalidateQueries({ queryKey: ['yard_dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fleet_overview'] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!target) return null

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign {target.chassis_number} to Load</DialogTitle>
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
              <Label>Load #</Label>
              <Input
                value={form.load_number}
                onChange={(e) => setForm({ ...form, load_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Container #</Label>
              <Input
                value={form.container_number}
                onChange={(e) =>
                  setForm({ ...form, container_number: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Account Manager</Label>
              <Select
                value={form.account_manager}
                onValueChange={(v) => setForm({ ...form, account_manager: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AM" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_MANAGERS.map((am) => (
                    <SelectItem key={am} value={am}>
                      {am}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Planned Exit Date</Label>
              <Input
                type="date"
                value={form.planned_exit_date}
                onChange={(e) =>
                  setForm({ ...form, planned_exit_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Driver Name</Label>
              <Input
                value={form.planned_driver_name}
                onChange={(e) =>
                  setForm({ ...form, planned_driver_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Carrier</Label>
              <Input
                value={form.outbound_carrier}
                onChange={(e) =>
                  setForm({ ...form, outbound_carrier: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.reservation_notes}
              onChange={(e) =>
                setForm({ ...form, reservation_notes: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const EXIT_REASONS = ['DISPATCHED', 'SHOP', 'OFFHIRE', 'TRANSFER']

export function GateOutModal({
  target,
  onClose,
}: {
  target: YardInventoryRow | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    exit_reason: 'DISPATCHED',
    exit_driver_name: '',
    exit_plate_cdl: '',
    notes: '',
  })

  useEffect(() => {
    if (target) {
      setForm({
        exit_reason: 'DISPATCHED',
        exit_driver_name: target.planned_driver_name ?? '',
        exit_plate_cdl: '',
        notes: '',
      })
    }
  }, [target])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error('No target')
      const update = {
        actual_exit_at: new Date().toISOString(),
        exit_reason: form.exit_reason,
        exit_driver_name: form.exit_driver_name || null,
        exit_plate_cdl: form.exit_plate_cdl || null,
        exit_recorded_by_user_id: 'web-user',
        reservation_notes: form.notes
          ? `${target.reservation_notes ?? ''} | EXIT NOTES: ${form.notes}`.trim()
          : target.reservation_notes,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('yard_inventory')
        .update(update)
        .eq('id', target.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis gated out')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      queryClient.invalidateQueries({ queryKey: ['yard_dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fleet_overview'] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!target) return null

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gate Out {target.chassis_number}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-3"
        >
          <div>
            <Label>Exit Reason</Label>
            <Select
              value={form.exit_reason}
              onValueChange={(v) => setForm({ ...form, exit_reason: v })}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Driver Name</Label>
              <Input
                value={form.exit_driver_name}
                onChange={(e) =>
                  setForm({ ...form, exit_driver_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Plate / CDL</Label>
              <Input
                value={form.exit_plate_cdl}
                onChange={(e) =>
                  setForm({ ...form, exit_plate_cdl: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Confirm Gate Out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const STATUS_OPTIONS = ['EMPTY', 'LOADED', 'SHOP', 'RESERVED']

export function AddToYardModal({
  open,
  onClose,
  defaultYardId,
}: {
  open: boolean
  onClose: () => void
  defaultYardId?: string
}) {
  const queryClient = useQueryClient()

  const { data: yards } = useQuery({
    queryKey: ['yards_for_modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yards')
        .select('id, name, short_code')
        .order('name')
      if (error) throw error
      return (data as YardOption[]) ?? []
    },
    enabled: open,
  })

  const [form, setForm] = useState({
    yard_id: '',
    chassis_number: '',
    spot: '',
    status: 'EMPTY',
    container_number: '',
    inbound_carrier: '',
    inbound_driver_name: '',
    inbound_plate_cdl: '',
    account_manager: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, yard_id: defaultYardId ?? f.yard_id }))
    }
  }, [open, defaultYardId])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.yard_id) throw new Error('Yard is required')
      if (!form.chassis_number.trim()) throw new Error('Chassis # is required')
      const chassis = form.chassis_number.trim().toUpperCase()

      const { data: chk, error: chkErr } = await supabase
        .from('mcl_chassis')
        .select('chassis_number')
        .eq('chassis_number', chassis)
        .maybeSingle()
      if (chkErr) throw chkErr
      if (!chk) throw new Error(`Chassis ${chassis} not found in MCL fleet`)

      const today = new Date().toISOString().slice(0, 10)
      const insert = {
        yard_id: form.yard_id,
        chassis_number: chassis,
        date_in: today,
        time_in: new Date().toTimeString().slice(0, 5),
        spot: form.spot || null,
        status: form.status,
        container_number: form.container_number || null,
        inbound_carrier: form.inbound_carrier || null,
        inbound_driver_name: form.inbound_driver_name || null,
        inbound_plate_cdl: form.inbound_plate_cdl || null,
        account_manager: form.account_manager || null,
        reservation_notes: form.notes || null,
      }
      const { error } = await supabase.from('yard_inventory').insert(insert)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Chassis added to yard')
      queryClient.invalidateQueries({ queryKey: ['yard_inventory'] })
      queryClient.invalidateQueries({ queryKey: ['yard_dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['fleet_overview'] })
      onClose()
      setForm({
        yard_id: defaultYardId ?? '',
        chassis_number: '',
        spot: '',
        status: 'EMPTY',
        container_number: '',
        inbound_carrier: '',
        inbound_driver_name: '',
        inbound_plate_cdl: '',
        account_manager: '',
        notes: '',
      })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Chassis to Yard</DialogTitle>
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
              <Label>Yard *</Label>
              <Select
                value={form.yard_id}
                onValueChange={(v) => setForm({ ...form, yard_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yard" />
                </SelectTrigger>
                <SelectContent>
                  {(yards ?? []).map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} ({y.short_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chassis # *</Label>
              <Input
                value={form.chassis_number}
                onChange={(e) =>
                  setForm({ ...form, chassis_number: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Spot</Label>
              <Input
                value={form.spot}
                onChange={(e) => setForm({ ...form, spot: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
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
                value={form.container_number}
                onChange={(e) =>
                  setForm({ ...form, container_number: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inbound Carrier</Label>
              <Input
                value={form.inbound_carrier}
                onChange={(e) =>
                  setForm({ ...form, inbound_carrier: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Inbound Driver</Label>
              <Input
                value={form.inbound_driver_name}
                onChange={(e) =>
                  setForm({ ...form, inbound_driver_name: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Inbound Plate / CDL</Label>
              <Input
                value={form.inbound_plate_cdl}
                onChange={(e) =>
                  setForm({ ...form, inbound_plate_cdl: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Account Manager</Label>
              <Select
                value={form.account_manager}
                onValueChange={(v) => setForm({ ...form, account_manager: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AM" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_MANAGERS.map((am) => (
                    <SelectItem key={am} value={am}>
                      {am}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Add to Yard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
