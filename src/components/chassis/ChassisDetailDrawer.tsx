import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { X, Copy, Truck, Package, History, Activity, Warehouse, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ChassisDetailDrawerProps {
  chassisNumber: string | null
  open: boolean
  onClose: () => void
  /** Optional overview data passed from the parent row for immediate display */
  rowData?: Record<string, unknown>
}

interface MgTmsRecord {
  ld_num: string | null
  so_num: string | null
  status: string | null
  customer_name: string | null
  acct_mg_name: string | null
  carrier_name: string | null
  pickup_loc_name: string | null
  pickup_city: string | null
  pickup_state: string | null
  pickup_actual_date: string | null
  delivery_loc_name: string | null
  delivery_city: string | null
  delivery_state: string | null
  delivery_actual_date: string | null
  container_number: string | null
  container_type: string | null
  mbl: string | null
  steamshipline: string | null
  service: string | null
  cust_rate_charge: number | null
  cust_invoice_charge: number | null
  carrier_rate_charge: number | null
  carrier_invoice_charge: number | null
  created_date: string | null
}

interface DcliRecord {
  date_out: string | null
  date_in: string | null
  days_out: number | null
  pick_up_location: string | null
  location_in: string | null
  container: string | null
  asset_type: string | null
  booking: string | null
}

interface YardEvent {
  EventDate: string | null
  EventTime: string | null
  Terminal: string | null
  EventDescription: string | null
  ContainerNo: string | null
  ContainerOwner: string | null
  Condition: string | null
}

interface ChassisMasterRecord {
  chassis_status: string | null
  chassis_category: string | null
  lessor: string | null
  region: string | null
  chassis_type: string | null
  on_hire_date: string | null
  off_hire_date: string | null
  contract_end_date: string | null
  current_rate_per_day: number | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

const FORREST_STATUS_OPTIONS = [
  'Active',
  'Reserved',
  'Available',
  'Out of Service',
  'Under Repair',
  'Returned',
  'Off-Hired',
  'Inactive',
]

function renderStatusBadge(status: string | null | undefined) {
  if (!status) return <Badge variant="outline">N/A</Badge>
  switch (status) {
    case 'Active':
      return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
    case 'Reserved':
      return <Badge className="bg-blue-600 hover:bg-blue-700">Reserved</Badge>
    case 'Available':
      return <Badge className="bg-teal-600 hover:bg-teal-700">Available</Badge>
    case 'Out of Service':
      return <Badge className="bg-orange-600 hover:bg-orange-700">Out of Service</Badge>
    case 'Under Repair':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Under Repair</Badge>
    case 'Returned':
      return <Badge variant="secondary">Returned</Badge>
    case 'Off-Hired':
      return <Badge variant="outline">Off-Hired</Badge>
    case 'Inactive':
      return <Badge variant="destructive">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function FieldGrid({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="font-medium">{item.value ?? 'N/A'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function ChassisDetailDrawer({
  chassisNumber,
  open,
  onClose,
  rowData,
}: ChassisDetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [activeLoad, setActiveLoad] = useState<MgTmsRecord | null>(null)
  const [loadHistory, setLoadHistory] = useState<MgTmsRecord[]>([])
  const [dcliActivity, setDcliActivity] = useState<DcliRecord[]>([])
  const [yardEvents, setYardEvents] = useState<YardEvent[]>([])
  const [masterRecord, setMasterRecord] = useState<ChassisMasterRecord | null>(null)
  const [statusValue, setStatusValue] = useState<string>('Active')
  const [notesValue, setNotesValue] = useState<string>('')
  const [savingStatus, setSavingStatus] = useState(false)

  const isForrestChassis =
    masterRecord?.lessor === 'Forrest' ||
    chassisNumber?.startsWith('FRQZ') ||
    chassisNumber?.startsWith('FRQT') ||
    false

  useEffect(() => {
    if (!chassisNumber || !open) return

    async function fetchData() {
      setLoading(true)
      try {
        const trimmed = chassisNumber!.trim()
        // Use ilike with trimmed value for fuzzy matching on spaces
        const [activeRes, historyRes, dcliRes, yardRes, masterRes] = await Promise.all([
          // Active load - most recent
          supabase
            .from('mg_data')
            .select('*')
            .ilike('chassis_number', `%${trimmed}%`)
            .order('created_date', { ascending: false })
            .limit(1),
          // Load history
          supabase
            .from('mg_data')
            .select(
              'ld_num, so_num, status, customer_name, pickup_loc_name, delivery_loc_name, pickup_actual_date, delivery_actual_date, cust_rate_charge, container_number, mbl, created_date'
            )
            .ilike('chassis_number', `%${trimmed}%`)
            .order('created_date', { ascending: false })
            .limit(50),
          // DCLI activity
          supabase
            .from('dcli_activity')
            .select('date_out, date_in, days_out, pick_up_location, location_in, container, asset_type, booking')
            .ilike('chassis', `%${trimmed}%`)
            .order('date_out', { ascending: false })
            .limit(50),
          // Yard events
          supabase
            .from('yard_events_data')
            .select('"EventDate", "EventTime", "Terminal", "EventDescription", "ContainerNo", "ContainerOwner", "Condition"')
            .eq('ChassisNo', chassisNumber)
            .order('EventDate', { ascending: false })
            .limit(50),
          // chassis_master record
          supabase
            .from('chassis_master')
            .select('chassis_status, chassis_category, lessor, region, chassis_type, on_hire_date, off_hire_date, contract_end_date, current_rate_per_day, notes, created_at, updated_at')
            .eq('chassis_number', chassisNumber)
            .maybeSingle(),
        ])

        setActiveLoad((activeRes.data?.[0] as MgTmsRecord) || null)
        setLoadHistory((historyRes.data as MgTmsRecord[]) || [])
        setDcliActivity((dcliRes.data as DcliRecord[]) || [])
        setYardEvents((yardRes.data as YardEvent[]) || [])
        const master = (masterRes.data as ChassisMasterRecord | null) || null
        setMasterRecord(master)
        setStatusValue(master?.chassis_status || 'Active')
        setNotesValue(master?.notes || '')
      } catch (err) {
        console.error('Failed to fetch chassis detail:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chassisNumber, open])

  async function handleStatusUpdate() {
    if (!chassisNumber) return
    setSavingStatus(true)
    try {
      const { error } = await supabase
        .from('chassis_master')
        .update({
          chassis_status: statusValue,
          notes: notesValue || null,
          updated_at: new Date().toISOString(),
        })
        .eq('chassis_number', chassisNumber)
      if (error) throw error
      toast.success(`Status updated for ${chassisNumber}`)
      setMasterRecord((prev) =>
        prev ? { ...prev, chassis_status: statusValue, notes: notesValue || null } : prev,
      )
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  function copyChassisNumber() {
    if (chassisNumber) {
      navigator.clipboard.writeText(chassisNumber)
      toast.success('Chassis number copied to clipboard')
    }
  }

  const totalLoads = loadHistory.length
  const totalRevenue = loadHistory.reduce((s, l) => s + (l.cust_rate_charge ?? 0), 0)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right">
        {/* Header */}
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <SheetTitle className="font-mono">{chassisNumber || 'Chassis Detail'}</SheetTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={copyChassisNumber}>
              <Copy className="h-3 w-3" />
              Copy #
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="w-full flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="active-load" className="text-xs">Active Load</TabsTrigger>
                <TabsTrigger value="load-history" className="text-xs">History ({totalLoads})</TabsTrigger>
                <TabsTrigger value="dcli" className="text-xs">DCLI ({dcliActivity.length})</TabsTrigger>
                <TabsTrigger value="yard" className="text-xs">Yard ({yardEvents.length})</TabsTrigger>
                <TabsTrigger value="manage" className="text-xs">{isForrestChassis ? 'Manage' : 'Info'}</TabsTrigger>
              </TabsList>

              {/* TAB 1: Overview */}
              <TabsContent value="overview">
                <FieldGrid
                  items={[
                    { label: 'Chassis Number', value: <span className="font-mono">{chassisNumber}</span> },
                    { label: 'Chassis Type', value: String(rowData?.chassis_type ?? 'N/A') },
                    { label: 'Chassis Description', value: String(rowData?.chassis_description ?? rowData?.chassis_desc ?? 'N/A') },
                    { label: 'Lessor / GPS', value: String(rowData?.lessor ?? 'N/A') },
                    { label: 'Current Status', value: rowData?.status ? <Badge variant="outline">{String(rowData.status)}</Badge> : 'N/A' },
                    { label: 'Landmark', value: String(rowData?.landmark ?? 'N/A') },
                    { label: 'Address', value: String(rowData?.address ?? 'N/A') },
                    { label: 'Days Dormant', value: rowData?.dormant_days != null ? String(rowData.dormant_days) : 'N/A' },
                    { label: 'Last Updated', value: formatDate(rowData?.last_updated as string | null) },
                  ]}
                />
              </TabsContent>

              {/* TAB 2: Active Load */}
              <TabsContent value="active-load">
                {!activeLoad ? (
                  <EmptyState
                    icon={Package}
                    title="No MercuryGate loads found"
                    description={`No mg_tms records found for chassis ${chassisNumber}.`}
                  />
                ) : (
                  <FieldGrid
                    items={[
                      { label: 'Load #', value: activeLoad.ld_num },
                      { label: 'SO #', value: activeLoad.so_num },
                      { label: 'Status', value: activeLoad.status ? <Badge variant="outline">{activeLoad.status}</Badge> : 'N/A' },
                      { label: 'Customer', value: activeLoad.customer_name },
                      { label: 'Account Manager', value: activeLoad.acct_mg_name },
                      { label: 'Carrier', value: activeLoad.carrier_name },
                      { label: 'Pickup Location', value: activeLoad.pickup_loc_name },
                      { label: 'Pickup City/State', value: [activeLoad.pickup_city, activeLoad.pickup_state].filter(Boolean).join(', ') || 'N/A' },
                      { label: 'Pickup Date', value: formatDate(activeLoad.pickup_actual_date) },
                      { label: 'Delivery Location', value: activeLoad.delivery_loc_name },
                      { label: 'Delivery City/State', value: [activeLoad.delivery_city, activeLoad.delivery_state].filter(Boolean).join(', ') || 'N/A' },
                      { label: 'Delivery Date', value: formatDate(activeLoad.delivery_actual_date) },
                      { label: 'Container #', value: activeLoad.container_number },
                      { label: 'Container Type', value: activeLoad.container_type },
                      { label: 'MBL', value: activeLoad.mbl },
                      { label: 'Steamship Line', value: activeLoad.steamshipline },
                      { label: 'Service', value: activeLoad.service },
                      { label: 'Customer Rate', value: formatCurrency(activeLoad.cust_rate_charge) },
                      { label: 'Customer Invoice', value: formatCurrency(activeLoad.cust_invoice_charge) },
                      { label: 'Carrier Rate', value: formatCurrency(activeLoad.carrier_rate_charge) },
                      { label: 'Carrier Invoice', value: formatCurrency(activeLoad.carrier_invoice_charge) },
                    ]}
                  />
                )}
              </TabsContent>

              {/* TAB 3: Load History */}
              <TabsContent value="load-history">
                {loadHistory.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No load history"
                    description={`No mg_tms records found for chassis ${chassisNumber}.`}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Total Loads: <span className="font-bold text-foreground">{totalLoads}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Total Revenue: <span className="font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">LD#</TableHead>
                            <TableHead className="text-xs">SO#</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Customer</TableHead>
                            <TableHead className="text-xs">Pickup</TableHead>
                            <TableHead className="text-xs">Delivery</TableHead>
                            <TableHead className="text-xs">Pickup Date</TableHead>
                            <TableHead className="text-xs">Delivery Date</TableHead>
                            <TableHead className="text-xs text-right">Revenue</TableHead>
                            <TableHead className="text-xs">Container</TableHead>
                            <TableHead className="text-xs">MBL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadHistory.map((l, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono">{l.ld_num ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.so_num ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.status ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.customer_name ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.pickup_loc_name ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.delivery_loc_name ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{formatDate(l.pickup_actual_date)}</TableCell>
                              <TableCell className="text-xs">{formatDate(l.delivery_actual_date)}</TableCell>
                              <TableCell className="text-xs text-right">{formatCurrency(l.cust_rate_charge)}</TableCell>
                              <TableCell className="text-xs">{l.container_number ?? 'N/A'}</TableCell>
                              <TableCell className="text-xs">{l.mbl ?? 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: DCLI Activity */}
              <TabsContent value="dcli">
                {dcliActivity.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No DCLI activity"
                    description={`No dcli_activity records found for chassis ${chassisNumber}.`}
                  />
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date Out</TableHead>
                          <TableHead className="text-xs">Date In</TableHead>
                          <TableHead className="text-xs text-right">Days Out</TableHead>
                          <TableHead className="text-xs">Pickup Location</TableHead>
                          <TableHead className="text-xs">Location In</TableHead>
                          <TableHead className="text-xs">Container</TableHead>
                          <TableHead className="text-xs">Asset Type</TableHead>
                          <TableHead className="text-xs">Booking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dcliActivity.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{formatDate(d.date_out)}</TableCell>
                            <TableCell className="text-xs">{formatDate(d.date_in)}</TableCell>
                            <TableCell className="text-xs text-right">{d.days_out ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{d.pick_up_location ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{d.location_in ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{d.container ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{d.asset_type ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{d.booking ?? 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* TAB 6: Manage / Info */}
              <TabsContent value="manage">
                {!masterRecord ? (
                  <EmptyState
                    icon={Settings2}
                    title="Not in chassis master"
                    description={`No chassis_master record found for ${chassisNumber}.`}
                  />
                ) : (
                  <div className="space-y-4">
                    <FieldGrid
                      items={[
                        { label: 'Chassis Status', value: renderStatusBadge(masterRecord.chassis_status) },
                        { label: 'Category', value: masterRecord.chassis_category },
                        { label: 'Lessor', value: masterRecord.lessor },
                        { label: 'Region', value: masterRecord.region },
                        { label: 'Chassis Type', value: masterRecord.chassis_type },
                        { label: 'On Hire Date', value: formatDate(masterRecord.on_hire_date) },
                        { label: 'Off Hire Date', value: formatDate(masterRecord.off_hire_date) },
                        { label: 'Contract End', value: formatDate(masterRecord.contract_end_date) },
                        { label: 'Rate / Day', value: formatCurrency(masterRecord.current_rate_per_day) },
                        { label: 'Notes', value: masterRecord.notes || '—' },
                        { label: 'Created', value: formatDate(masterRecord.created_at) },
                        { label: 'Updated', value: formatDate(masterRecord.updated_at) },
                      ]}
                    />

                    {isForrestChassis && (
                      <div className="border-t pt-4 space-y-3">
                        <h4 className="text-sm font-semibold">Update Status</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                            <Select value={statusValue} onValueChange={setStatusValue}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FORREST_STATUS_OPTIONS.map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                            <Textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Notes..."
                              rows={3}
                            />
                          </div>
                          <Button onClick={handleStatusUpdate} disabled={savingStatus}>
                            {savingStatus ? 'Saving...' : 'Update Status'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* TAB 5: Yard Events */}
              <TabsContent value="yard">
                {yardEvents.length === 0 ? (
                  <EmptyState
                    icon={Warehouse}
                    title="No yard events"
                    description={`No yard_events_data records found for chassis ${chassisNumber}.`}
                  />
                ) : (
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Time</TableHead>
                          <TableHead className="text-xs">Terminal</TableHead>
                          <TableHead className="text-xs">Event</TableHead>
                          <TableHead className="text-xs">Container</TableHead>
                          <TableHead className="text-xs">Owner</TableHead>
                          <TableHead className="text-xs">Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yardEvents.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{formatDate(e.EventDate)}</TableCell>
                            <TableCell className="text-xs">{e.EventTime ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{e.Terminal ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{e.EventDescription ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{e.ContainerNo ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{e.ContainerOwner ?? 'N/A'}</TableCell>
                            <TableCell className="text-xs">{e.Condition ?? 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
