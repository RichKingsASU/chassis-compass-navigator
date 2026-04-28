import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { 
  Truck, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Activity,
  History,
  Download
} from 'lucide-react'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressCircle } from '@/components/shared/ProgressCircle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'

import { ColumnDef } from '@tanstack/react-table'
import { mockChassisUtilization } from '@/features/operations/mockData'
import { ChassisUtilizationMetric } from '@/types/operations'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { safeAmount, safeDate } from '@/lib/formatters'
import { useSearchParams } from 'react-router-dom'
import { exportToExcel } from '@/utils/exportUtils'

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

function isForrestRow(d: UtilizationRow): boolean {
  return d.lessor === 'Forrest' || (d.chassis_number?.startsWith('FRQZ') ?? false)
}

function renderForrestStatusBadge(status: string | null | undefined) {
  if (!status) return <span className="text-muted-foreground">—</span>
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

function StatusChangePopover({
  chassisNumber,
  currentStatus,
}: {
  chassisNumber: string
  currentStatus: string | null
}) {
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>(currentStatus || 'Active')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const updatePayload: Record<string, unknown> = {
        chassis_status: newStatus,
        updated_at: new Date().toISOString(),
      }
      if (notes.trim()) {
        updatePayload.notes = notes.trim()
      }
      const { error } = await supabase
        .from('chassis_master')
        .update(updatePayload)
        .eq('chassis_number', chassisNumber)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['v_chassis_utilization'] })
      toast.success(`Status updated for ${chassisNumber}`)
      setOpen(false)
      setNotes('')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
          <Settings2 className="h-3 w-3" />
          Change Status
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Status</p>
            {renderForrestStatusBadge(currentStatus)}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORREST_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimelineMilestone {
  label: string
  date: string
  color: string
}

function ChassisTimeline({
  chassis,
  onClose,
}: {
  chassis: UtilizationRow
  onClose: () => void
}) {
  const milestones: TimelineMilestone[] = []
  if (chassis.first_load_date) milestones.push({ label: 'First Load', date: chassis.first_load_date, color: '#3b82f6' })
  if (chassis.on_hire_date) milestones.push({ label: 'On Hire', date: chassis.on_hire_date, color: '#10b981' })
  if (chassis.off_hire_date) milestones.push({ label: 'Off Hire', date: chassis.off_hire_date, color: '#f59e0b' })
  if (chassis.contract_end_date) milestones.push({ label: 'Contract End', date: chassis.contract_end_date, color: '#8b5cf6' })
  if (chassis.last_activity_date) milestones.push({ label: 'Last Load', date: chassis.last_activity_date, color: '#ef4444' })

  const sorted = [...milestones]
    .filter((m) => m.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const minTs = sorted.length ? new Date(sorted[0].date).getTime() : 0
  const maxTs = sorted.length ? new Date(sorted[sorted.length - 1].date).getTime() : 0
  const range = maxTs - minTs || 1

  const totalRevenue = Number(chassis.total_revenue) || 0
  const status = chassis.utilization_status || 'UNKNOWN'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-mono text-base">{chassis.chassis_number}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {chassis.lessor || '—'} · {chassis.chassis_type || '—'} · Revenue {safeAmount(totalRevenue)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'ACTIVE' && <Badge className="bg-green-600">ACTIVE</Badge>}
            {status === 'IDLE' && <Badge variant="secondary">IDLE</Badge>}
            {status === 'DORMANT' && <Badge variant="destructive">DORMANT</Badge>}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No timeline data available</p>
        ) : (
          <div className="space-y-2">
            <div className="w-full h-24 relative">
              <svg viewBox="0 0 1000 96" preserveAspectRatio="none" className="w-full h-full">
                <line x1="20" y1="48" x2="980" y2="48" stroke="#cbd5e1" strokeWidth="2" />
                {sorted.map((m, i) => {
                  const x = 20 + ((new Date(m.date).getTime() - minTs) / range) * 960
                  return (
                    <g key={i}>
                      <title>{`${m.label}: ${safeDate(m.date)}`}</title>
                      <circle cx={x} cy={48} r={6} fill={m.color} stroke="white" strokeWidth="2" />
                      <text x={x} y={28} textAnchor="middle" fontSize="10" fill="#475569">{m.label}</text>
                      <text x={x} y={72} textAnchor="middle" fontSize="9" fill="#64748b">{safeDate(m.date)}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            {totalRevenue > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Revenue</span>
                  <span>{safeAmount(totalRevenue)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ChassisUtilization() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  
  const searchFilter = searchParams.get('q') || ''

  const { data: realData, isLoading } = useQuery({
    queryKey: ['v_chassis_utilization'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_chassis_utilization').select('*')
      if (error) throw error
      return data
    }
  })

  const data: ChassisUtilizationMetric[] = React.useMemo(() => {
    if (realData && realData.length > 0) {
      return realData.map((r: any) => ({
        chassisNumber: r.chassis_number,
        status: r.utilization_status as any || 'ACTIVE',
        location: r.region || 'Unknown',
        daysInUse: (r.total_loads || 0) * 2, // Mocking days in use
        daysIdle: r.days_idle || 0,
        utilizationPercent: r.utilization_status === 'ACTIVE' ? 85 : (r.utilization_status === 'IDLE' ? 20 : 0),
        customer: r.acct_mgr,
        lastMoveDate: r.last_activity_date
      }))
    }
    return mockChassisUtilization
  }, [realData])

  const totalChassis = data.length
  const inUse = data.filter(c => c.status === 'ACTIVE').length
  const idle = data.filter(c => c.status === 'IDLE').length
  const dormant = data.filter(c => c.status === 'DORMANT').length
  const utilizationRate = totalChassis > 0 ? (inUse / totalChassis) * 100 : 0

  const statusData = [
    { name: 'Active', value: inUse, color: 'hsl(var(--primary))' },
    { name: 'Idle', value: idle, color: 'hsl(var(--muted-foreground))' },
    { name: 'Dormant', value: dormant, color: 'hsl(var(--destructive))' },
    { name: 'OOS', value: data.filter(c => c.status === 'OOS').length, color: '#000000' },
  ].filter(d => d.value > 0)

  const columns: ColumnDef<ChassisUtilizationMetric>[] = [
    {
      accessorKey: 'chassisNumber',
      header: 'Chassis #',
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('chassisNumber')}</div>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants: Record<string, string> = {
          ACTIVE: 'default',
          IDLE: 'secondary',
          DORMANT: 'destructive',
          OOS: 'outline'
        }
        return <Badge variant={variants[status] as any || 'outline'}>{status}</Badge>
      }
    },
    {
      accessorKey: 'location',
      header: 'Current Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {row.getValue('location') || 'N/A'}
        </div>
      )
    },
    {
      accessorKey: 'utilizationPercent',
      header: 'Utilization',
      cell: ({ row }) => {
        const val = row.getValue('utilizationPercent') as number
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${val > 70 ? 'bg-green-500' : val > 30 ? 'bg-amber-500' : 'bg-destructive'}`} 
                style={{ width: `${val}%` }} 
              />
            </div>
            <span className="text-xs font-medium">{val}%</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'daysIdle',
      header: 'Days Idle',
      cell: ({ row }) => {
        const days = row.getValue('daysIdle') as number
        return (
          <span className={days > 15 ? 'text-destructive font-bold' : ''}>
            {days} d
          </span>
        )
      }
    },
    {
      accessorKey: 'lastMoveDate',
      header: 'Last Activity',
      cell: ({ row }) => safeDate(row.getValue('lastMoveDate'))
    }
  ]

  const handleExport = () => {
    const selectedRows = data.filter((_, index) => rowSelection[index])
    const exportData = selectedRows.length > 0 ? selectedRows : data
    exportToExcel(exportData, `Chassis_Utilization_${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chassis Utilization</h1>
          <p className="text-muted-foreground">
            Monitor fleet efficiency and location-based asset performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {Object.keys(rowSelection).length > 0 ? `Export Selected (${Object.keys(rowSelection).length})` : 'Export All'}
          </Button>
          <Button variant="outline"><Activity className="mr-2 h-4 w-4" /> Real-time Map</Button>
          <Button><History className="mr-2 h-4 w-4" /> History</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <ProgressCircle value={utilizationRate} size="lg" />
          </CardContent>
        </Card>
        
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChassis}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Truck className="h-3 w-3 mr-1" /> Registered units
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{inUse}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                {(inUse/totalChassis*100).toFixed(1)}% active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Idle Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{idle}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1" /> Waiting for load
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critical Dormant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dormant}</div>
              <p className="text-xs text-destructive flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" /> Over 15 days idle
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
            <CardDescription>Breakdown by utilization category</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Utilization by Location</CardTitle>
            <CardDescription>Asset distribution across terminals and yards</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
             {/* Mock location distribution */}
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'LAX', active: 45, idle: 12 },
                  { name: 'LGB', active: 38, idle: 8 },
                  { name: 'OAK', active: 22, idle: 15 },
                  { name: 'CHI', active: 15, idle: 22 },
                  { name: 'SAV', active: 30, idle: 5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" name="Active" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="idle" name="Idle" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Detail Table</CardTitle>
          <CardDescription>Granular view of all chassis in the fleet.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={data} 
            searchKey="chassisNumber"
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
      </Card>
    </div>
  )
}
