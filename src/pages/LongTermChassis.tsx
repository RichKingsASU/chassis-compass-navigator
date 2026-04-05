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
  { key: 'lessor', label: 'Lessor', visible: true, width: 120 },
  { key: 'status', label: 'Status', visible: true, width: 100, format: (v) => v ? <Badge variant="outline">{String(v)}</Badge> : 'N/A' },
  { key: 'landmark', label: 'Landmark', visible: true, width: 160 },
  { key: 'address', label: 'Address', visible: true, width: 200 },
  { key: 'dormant_days', label: 'Days Dormant', visible: true, width: 120, align: 'right', format: (v) => {
    const d = Number(v)
    if (isNaN(d)) return 'N/A'
    const variant = d > 30 ? 'destructive' : d > 14 ? 'secondary' : 'outline'
    return <Badge variant={variant as 'destructive' | 'secondary' | 'outline'}>{d}d</Badge>
  }},
  { key: 'last_updated', label: 'Last Updated', visible: true, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'container_number', label: 'Container #', visible: true, width: 140 },
  { key: 'customer_name', label: 'Customer', visible: true, width: 160 },
  { key: 'cust_rate_charge', label: 'Customer Rate', visible: true, width: 110, align: 'right', format: (v) => formatCurrency(v as number | null) },
  { key: 'total_loads', label: 'Total Loads', visible: true, width: 100, align: 'right' },
  { key: 'total_revenue', label: 'Total Revenue', visible: true, width: 120, align: 'right', format: (v) => formatCurrency(v as number | null) },
  { key: 'last_load_date', label: 'Last Load Date', visible: true, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'chassis_description', label: 'Description', visible: false, width: 160 },
  { key: 'ld_num', label: 'Load #', visible: false, width: 120 },
  { key: 'so_num', label: 'SO #', visible: false, width: 120 },
  { key: 'acct_mg_name', label: 'Account Mgr', visible: false, width: 140 },
  { key: 'pickup_loc_name', label: 'Pickup Location', visible: false, width: 180 },
  { key: 'delivery_loc_name', label: 'Delivery Location', visible: false, width: 180 },
  { key: 'pickup_actual_date', label: 'Pickup Date', visible: false, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'delivery_actual_date', label: 'Delivery Date', visible: false, width: 120, format: (v) => formatDate(v as string | null) },
  { key: 'mbl', label: 'MBL', visible: false, width: 140 },
  { key: 'service', label: 'Service', visible: false, width: 120 },
]

export default function LongTermChassis() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedChassis, setSelectedChassis] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | undefined>()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Fetch from mg_tms — we'll compute dormancy client-side from last activity
        const { data: result, error: fetchErr } = await supabase
          .from('mg_tms')
          .select('*')
          .order('created_date', { ascending: false })
          .limit(2000)

        if (fetchErr) throw fetchErr

        // Aggregate by chassis_number for dormant analysis
        const chassisMap = new Map<string, Record<string, unknown>[]>()
        for (const row of (result || [])) {
          const cn = String((row as Record<string, unknown>).chassis_number ?? '').trim()
          if (!cn) continue
          if (!chassisMap.has(cn)) chassisMap.set(cn, [])
          chassisMap.get(cn)!.push(row as Record<string, unknown>)
        }

        // Build long-term view rows (one per chassis)
        const now = Date.now()
        const rows: Record<string, unknown>[] = []
        for (const [cn, records] of chassisMap) {
          const sorted = records.sort((a, b) => {
            const da = new Date(String(a.created_date ?? '')).getTime() || 0
            const db = new Date(String(b.created_date ?? '')).getTime() || 0
            return db - da
          })
          const latest = sorted[0]
          const lastDate = new Date(String(latest.delivery_actual_date ?? latest.pickup_actual_date ?? latest.created_date ?? ''))
          const dormantDays = !isNaN(lastDate.getTime()) ? Math.round((now - lastDate.getTime()) / 86_400_000) : null
          const totalRevenue = records.reduce((s, r) => s + (Number(r.cust_rate_charge) || 0), 0)

          rows.push({
            ...latest,
            chassis_number: cn,
            dormant_days: dormantDays,
            last_load_date: latest.delivery_actual_date ?? latest.pickup_actual_date ?? latest.created_date,
            total_loads: records.length,
            total_revenue: totalRevenue,
            last_updated: latest.created_date,
          })
        }

        // Sort by dormant days descending (most dormant first)
        rows.sort((a, b) => (Number(b.dormant_days) || 0) - (Number(a.dormant_days) || 0))
        setData(rows)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load long-term chassis data')
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

  const dormantOver30 = data.filter((r) => Number(r.dormant_days) > 30).length
  const dormantOver14 = data.filter((r) => Number(r.dormant_days) > 14).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Long Term Chassis</h1>
        <p className="text-muted-foreground">Dormancy analysis — one row per chassis, sorted by inactivity</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold">{data.length}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dormant &gt; 14 Days</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-yellow-600">{dormantOver14}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dormant &gt; 30 Days</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-bold text-red-600">{dormantOver30}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ChassisTable
            data={data}
            columns={COLUMNS}
            title="long_term"
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
