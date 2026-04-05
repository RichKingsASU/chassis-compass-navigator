import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useUnbilledCount } from '@/hooks/useUnbilledCount'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface RecentLoad {
  ld_num: string
  status: string
  updated_date: string
}

interface VendorRow { vendor: string; invoices: number; amount: number }
interface GpsRow { name: string; value: number }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const GPS_TABLES = [
  { table: 'samsara_gps', name: 'Samsara' },
  { table: 'anytrek_gps', name: 'Anytrek' },
  { table: 'blackberry_log_gps', name: 'BlackBerry Log' },
  { table: 'blackberry_tran_gps', name: 'BlackBerry Tran' },
  { table: 'fleetlocate_gps', name: 'FleetLocate' },
] as const

async function loadVendorData(): Promise<VendorRow[]> {
  const results: VendorRow[] = []
  try {
    const { data, error } = await supabase
      .from('dcli_activity')
      .select('portal_status, amount')
    if (!error && data) {
      const amount = data.reduce((s, r) => s + (Number(r.amount) || 0), 0)
      results.push({ vendor: 'DCLI', invoices: data.length, amount })
    }
  } catch { /* skip */ }
  try {
    const { count } = await supabase.from('ccm_activity').select('id', { count: 'exact', head: true })
    results.push({ vendor: 'CCM', invoices: count || 0, amount: 0 })
  } catch { /* skip */ }
  try {
    const { count } = await supabase.from('scspa_activity').select('id', { count: 'exact', head: true })
    results.push({ vendor: 'SCSPA', invoices: count || 0, amount: 0 })
  } catch { /* skip */ }
  if (results.length === 0) {
    return [
      { vendor: 'DCLI', invoices: 0, amount: 0 },
      { vendor: 'CCM', invoices: 0, amount: 0 },
      { vendor: 'SCSPA', invoices: 0, amount: 0 },
    ]
  }
  return results
}

async function loadGpsData(): Promise<GpsRow[]> {
  const results: GpsRow[] = []
  for (const { table, name } of GPS_TABLES) {
    try {
      const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
      results.push({ name, value: count || 0 })
    } catch {
      results.push({ name, value: 0 })
    }
  }
  return results
}

export default function Dashboard() {
  const [recentLoads, setRecentLoads] = useState<RecentLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [chassisCount, setChassisCount] = useState(0)
  const [gpsProvidersActive, setGpsProvidersActive] = useState(0)
  const [recentActivityCount, setRecentActivityCount] = useState(0)
  const [vendorData, setVendorData] = useState<VendorRow[]>([])
  const [gpsData, setGpsData] = useState<GpsRow[]>([])
  const { count: unbilledCount, totalAtRisk } = useUnbilledCount()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [ltRes, stRes, recentRes, vendors, gps] = await Promise.all([
          supabase.from('long_term_lease_owned').select('id', { count: 'exact', head: true }),
          supabase.from('short_term_lease').select('id', { count: 'exact', head: true }),
          supabase.from('mg_data').select('ld_num, status, updated_date').order('updated_date', { ascending: false }).limit(10),
          loadVendorData(),
          loadGpsData(),
        ])
        setChassisCount((ltRes.count || 0) + (stRes.count || 0))
        setRecentLoads(recentRes.data || [])
        setVendorData(vendors)
        setGpsData(gps)

        const active = gps.filter(g => g.value > 0).length
        setGpsProvidersActive(active)

        // Recent activity count (last 7 days)
        const { count: weekCount } = await supabase
          .from('mg_data')
          .select('id', { count: 'exact', head: true })
          .gte('updated_date', new Date(Date.now() - 7 * 86_400_000).toISOString())
        setRecentActivityCount(weekCount || 0)
      } catch (err) {
        console.error('[Dashboard] load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Chassis Compass Navigator — Fleet Overview</p>
        <DataFreshnessBar tableName="mg_data" label="TMS Data" />
      </div>

      {unbilledCount > 0 && (
        <Link to="/unbilled-loads" className="block">
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-md text-yellow-800 text-sm font-medium">
            {unbilledCount} loads flagged unbilled — {formatCurrency(totalAtRisk)} at risk
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{chassisCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Long term + short term leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">GPS Coverage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gpsProvidersActive} of {GPS_TABLES.length}</p>
            <p className="text-xs text-muted-foreground mt-1">providers have data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{recentActivityCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">TMS updates in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Vendor Invoice Volume</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={vendorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" />
                <YAxis />
                <Tooltip formatter={(value: number, name: string) => name === 'amount' ? formatCurrency(value) : value} />
                <Bar dataKey="invoices" fill="#3b82f6" name="Invoices" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>GPS Provider Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={gpsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props: { name?: string; percent?: number }) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}>
                  {gpsData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Fleet Map</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 bg-gradient-to-br from-blue-100 via-green-50 to-blue-200 rounded-lg flex items-center justify-center border">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Fleet Map</p>
                <p className="text-sm text-muted-foreground">Connect Google Maps API</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-6 bg-muted animate-pulse rounded" />)}</div>
            ) : recentLoads.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent TMS activity.</p>
            ) : (
              <ul className="space-y-2">
                {recentLoads.map(r => (
                  <li key={r.ld_num} className="flex justify-between text-sm border-b pb-2">
                    <span className="font-mono">{r.ld_num}</span>
                    <Badge variant="outline">{r.status}</Badge>
                    <span className="text-muted-foreground text-xs">{formatDate(r.updated_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
