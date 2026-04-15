import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ChassisTable, { type ColumnDef } from '@/components/chassis/ChassisTable'
import ChassisDetailDrawer from '@/components/chassis/ChassisDetailDrawer'

const COLUMNS: ColumnDef[] = [
  { key: 'chassis_number', label: 'Chassis #', visible: true, width: 140, format: (v) => <span className="font-mono font-medium">{String(v ?? '')}</span> },
  { key: 'chassis_type', label: 'Chassis Type', visible: true, width: 110, format: (v) => v ? <Badge variant="outline">{String(v)}</Badge> : 'N/A' },
  { key: 'chassis_description', label: 'Description', visible: true, width: 160 },
  { key: 'lessor', label: 'Lessor', visible: true, width: 120 },
  { key: 'status', label: 'Status', visible: true, width: 100, format: (v) => v ? <Badge variant="outline">{String(v)}</Badge> : 'N/A' },
  { key: 'landmark', label: 'Landmark', visible: true, width: 160 },
  { key: 'address', label: 'Address', visible: true, width: 200 },
  { key: 'container_number', label: 'Container #', visible: true, width: 140 },
  { key: 'container_type', label: 'Container Type', visible: true, width: 110 },
  { key: 'ld_num', label: 'Load #', visible: true, width: 120 },
  { key: 'so_num', label: 'SO #', visible: true, width: 120 },
  { key: 'acct_mg_name', label: 'Account Mgr', visible: true, width: 140 },
  { key: 'customer_name', label: 'Customer', visible: true, width: 160 },
  { key: 'pickup_loc_name', label: 'Pickup Location', visible: true, width: 180 },
  { key: 'delivery_loc_name', label: 'Delivery Location', visible: true, width: 180 },
  { key: 'mbl', label: 'MBL', visible: true, width: 140 },
  { key: 'service', label: 'Service', visible: true, width: 120 },
  { key: 'carrier_name', label: 'Carrier', visible: false, width: 140 },
  { key: 'pickup_actual_date', label: 'Pickup Date', visible: false, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'delivery_actual_date', label: 'Delivery Date', visible: false, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'cust_rate_charge', label: 'Customer Rate', visible: false, width: 110, align: 'right', format: (v) => formatCurrency(v as number | null) },
  { key: 'steamship_line', label: 'Steamship Line', visible: false, width: 130 },
  { key: 'dormant_days', label: 'Days Dormant', visible: false, width: 110, align: 'right' },
  { key: 'last_updated', label: 'Last Updated', visible: false, width: 120, format: (v) => formatDate(v as string | null) },
]

export default function ChassisOverview() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedChassis, setSelectedChassis] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | undefined>()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: result, error: fetchErr, count } = await supabase
          .from('mg_tms')
          .select('*', { count: 'exact' })
          .order('create_date', { ascending: false })
          .limit(2000)

        if (fetchErr) throw fetchErr
        setData(result || [])
        setTotalCount(count || 0)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleViewRow(row: Record<string, unknown>) {
    const cn = String(row.chassis_number ?? '').trim()
    if (!cn) return
    setSelectedChassis(cn)
    setSelectedRow(row)
    setDrawerOpen(true)
  }

  // Summary stats from real data
  const uniqueChassis = new Set(data.map((r) => String(r.chassis_number ?? '').trim()).filter(Boolean)).size
  const activeLoads = data.filter((r) => {
    const s = String(r.status ?? '').toLowerCase()
    return s.includes('active') || s.includes('in transit') || s.includes('dispatched')
  }).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Overview</h1>
        <p className="text-muted-foreground">All chassis with MercuryGate TMS data</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-blue-600">{uniqueChassis}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Loads</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-green-600">{activeLoads}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <ChassisTable
            data={data}
            columns={COLUMNS}
            title="overview"
            loading={loading}
            onViewRow={handleViewRow}
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rowData={selectedRow}
      />
    </div>
  )
}
