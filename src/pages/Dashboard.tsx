import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Activity {
  id: string
  description: string
  type: string
  created_at: string
}

interface VendorRow { vendor: string; invoices: number; amount: number }
interface GpsRow { name: string; value: number }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// Vendor invoice tables to query
const VENDOR_TABLES = [
  { table: 'dcli_invoice', label: 'DCLI' },
  { table: 'ccm_invoice', label: 'CCM' },
  { table: 'trac_invoice', label: 'TRAC' },
  { table: 'flexivan-invoices', label: 'FLEXIVAN' },
  { table: 'wccp_invoice', label: 'WCCP' },
  { table: 'scspa_invoice', label: 'SCSPA' },
] as const

// GPS provider names used in gps_data.provider
const GPS_PROVIDERS = ['Samsara', 'BlackBerry', 'Fleetview', 'Fleetlocate', 'Anytrek'] as const

async function loadVendorData(): Promise<VendorRow[]> {
  const results: VendorRow[] = []
  for (const { table, label } of VENDOR_TABLES) {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
    if (count && count > 0) {
      const { data } = await supabase.from(table).select('total_amount')
      const amount = (data || []).reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
      results.push({ vendor: label, invoices: count, amount })
    }
  }
  if (results.length === 0) {
    return []
  }
  return results
}

async function loadGpsData(): Promise<GpsRow[]> {
  const results: GpsRow[] = []
  for (const provider of GPS_PROVIDERS) {
    const { count } = await supabase
      .from('gps_data')
      .select('id', { count: 'exact', head: true })
      .ilike('provider', provider)
    results.push({ name: provider, value: count || 0 })
  }
  return results
}

export default function Dashboard() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [chassisCount, setChassisCount] = useState(0)
  const [gpsCount, setGpsCount] = useState(0)
  const [vendorData, setVendorData] = useState<VendorRow[]>([])
  const [gpsData, setGpsData] = useState<GpsRow[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [actRes, chassisRes, gpsRes, vendors, gps] = await Promise.all([
          supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('chassis').select('id', { count: 'exact', head: true }),
          supabase.from('gps_data').select('id', { count: 'exact', head: true }),
          loadVendorData(),
          loadGpsData(),
        ])
        setActivities(actRes.data || [])
        setChassisCount(chassisRes.count || 0)
        setGpsCount(gpsRes.count || 0)
        setVendorData(vendors)
        setGpsData(gps)
      } catch {
        // silently fail — dashboard shows empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const gpsCoverage = chassisCount > 0 ? Math.round((gpsCount / chassisCount) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Chassis Compass Navigator — Fleet Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{chassisCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Active fleet units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">GPS Coverage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gpsCoverage}%</p>
            <p className="text-xs text-muted-foreground mt-1">{gpsCount.toLocaleString()} tracked units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activities.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 10 events</p>
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
                <Tooltip formatter={(value, name) => name === 'amount' ? formatCurrency(value as number) : value} />
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
                <Pie data={gpsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}>
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
              <p className="text-muted-foreground">Loading...</p>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Activity will appear here as you use the system</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {activities.map(a => (
                  <li key={a.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{a.description}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(a.created_at)}</span>
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
