import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface VendorRow { vendor: string; count: number }
interface GpsRow { name: string; value: number }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [chassisCount, setChassisCount] = useState(0)
  const [gpsCoverage, setGpsCoverage] = useState(0)
  const [recentActivityCount, setRecentActivityCount] = useState(0)
  const [vendorData, setVendorData] = useState<VendorRow[]>([])
  const [gpsData, setGpsData] = useState<GpsRow[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: chassisData } = await supabase
          .from('chassis_master')
          .select('chassis_number, gps_provider')
        const total = chassisData?.length || 0
        setChassisCount(total)
        const ltCount = total
        const stCount = 0
        setChassisCount(total)

        const withGps = (chassisData || []).filter(r => r.gps_provider != null && r.gps_provider !== '').length
        setGpsCoverage(total > 0 ? Math.round((withGps / total) * 100) : 0)

        // Recent activity from mg_data
        const { count: actCount } = await supabase
          .from('mg_data')
          .select('id', { count: 'exact', head: true })
        setRecentActivityCount(actCount || 0)

        // Vendor record counts
        const vendors: VendorRow[] = []
        for (const { table, label } of [
          { table: 'dcli_activity', label: 'DCLI' },
          { table: 'ccm_activity', label: 'CCM' },
          { table: 'scspa_activity', label: 'SCSPA' },
        ] as const) {
          try {
            const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
            vendors.push({ vendor: label, count: count || 0 })
          } catch {
            vendors.push({ vendor: label, count: 0 })
          }
        }
        setVendorData(vendors)

        // GPS provider distribution
        const gpsProviders = ['Samsara', 'BlackBerry', 'Fleetview', 'Fleetlocate', 'Anytrek']
        const gpsResults: GpsRow[] = gpsProviders.map(provider => ({
          name: provider,
          value: (chassisData || []).filter(r => r.gps_provider?.toLowerCase().includes(provider.toLowerCase())).length,
        }))
        setGpsData(gpsResults)
      } catch {
        // dashboard shows empty state
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : chassisCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Active fleet units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              GPS Coverage
              <Tooltip>
                <TooltipTrigger asChild><span className="text-xs cursor-help">(?)</span></TooltipTrigger>
                <TooltipContent>Long-term chassis with a GPS provider assigned</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : `${gpsCoverage}%`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">TMS Records</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? '...' : recentActivityCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total MG loads</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Vendor Record Counts</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={vendorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Records" />
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
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

