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
  { key: 'status', label: 'Status', visible: true, width: 100, format: (v) => v ? <Badge variant="outline">{String(v)}</Badge> : 'N/A' },
  { key: 'pickup_actual_date', label: 'Pickup Date', visible: true, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'delivery_actual_date', label: 'Delivery Date', visible: true, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'customer_name', label: 'Customer', visible: true, width: 160 },
  { key: 'delivery_loc_name', label: 'Delivery Location', visible: true, width: 180 },
  { key: 'container_number', label: 'Container #', visible: true, width: 140 },
  { key: 'mbl', label: 'MBL', visible: true, width: 140 },
  { key: 'cust_rate_charge', label: 'Customer Rate', visible: true, width: 110, align: 'right', format: (v) => formatCurrency(v as number | null) },
  { key: 'chassis_description', label: 'Description', visible: false, width: 160 },
  { key: 'lessor', label: 'Lessor', visible: false, width: 120 },
  { key: 'landmark', label: 'Landmark', visible: false, width: 160 },
  { key: 'address', label: 'Address', visible: false, width: 200 },
  { key: 'ld_num', label: 'Load #', visible: false, width: 120 },
  { key: 'so_num', label: 'SO #', visible: false, width: 120 },
  { key: 'acct_mg_name', label: 'Account Mgr', visible: false, width: 140 },
  { key: 'carrier_name', label: 'Carrier', visible: false, width: 140 },
  { key: 'pickup_loc_name', label: 'Pickup Location', visible: false, width: 180 },
  { key: 'container_type', label: 'Container Type', visible: false, width: 110 },
  { key: 'steamshipline', label: 'Steamship Line', visible: false, width: 130 },
  { key: 'service', label: 'Service', visible: false, width: 120 },
  { key: 'carrier_rate_charge', label: 'Carrier Rate', visible: false, width: 110, align: 'right', format: (v) => formatCurrency(v as number | null) },
]

export default function ShortTermChassis() {
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
        // Recent/active loads — ordered by most recent pickup
        const { data: result, error: fetchErr, count } = await supabase
          .from('mg_tms')
          .select('*', { count: 'exact' })
          .order('pickup_actual_date', { ascending: false })
          .limit(2000)

        if (fetchErr) throw fetchErr
        setData((result as Record<string, unknown>[]) || [])
        setTotalCount(count || 0)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load short-term chassis data')
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

  // Compute KPIs
  const totalRevenue = data.reduce((s, r) => s + (Number(r.cust_rate_charge) || 0), 0)
  const recentPickups = data.filter((r) => {
    const d = new Date(String(r.pickup_actual_date ?? ''))
    if (isNaN(d.getTime())) return false
    const daysAgo = (Date.now() - d.getTime()) / 86_400_000
    return daysAgo <= 7
  }).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Short Term Chassis</h1>
        <p className="text-muted-foreground">Active and recent loads — sorted by latest pickup date</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold">{totalCount.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pickups (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-green-600">{recentPickups}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ChassisTable
            data={data}
            columns={COLUMNS}
            title="short_term"
            loading={loading}
            onViewRow={handleViewRow}
          />
        </CardContent>
      </Card>

      <ChassisDetailDrawer
        chassisNumber={selectedChassis}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        rowData={selectedRow}
      />
    </div>
  )
}
