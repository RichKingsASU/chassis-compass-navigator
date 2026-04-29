import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DataFreshnessBar from '@/components/DataFreshnessBar'
import { Analytics } from '@/utils/analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { safeAmount } from '@/lib/formatters'
import { TrendingDown, AlertCircle, Timer } from 'lucide-react'

interface VendorRow { vendor: string; count: number }
interface GpsRow { name: string; value: number }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface ChassisMasterRow { chassis_number: string | null; gps_provider: string | null }

interface UnbilledSummary {
  total_count: number
  total_at_risk: number
  avg_days_since_drop: number
  invoice_zero_count: number
  no_chassis_count: number
}

interface GapSummary {
  total_gap: number
  gap_pct: number
  total_loads: number
  unbilled_loads: number
  total_rated: number
  total_invoiced: number
  by_region: { region: string; total_gap: number; gap_pct: number }[]
}

interface DormantTopRow {
  chassis_number: string
  lessor: string
  region: string
  days_idle: number
  idle_lease_cost: number
  lease_rate_per_day: number
  last_activity_date: string
  total_revenue: number
}

interface DormantSummary {
  dormant_count: number
  idle_count: number
  active_count: number
  total_chassis: number
  total_idle_lease_cost: number
  total_dormant_lease_cost: number
  avg_days_idle_dormant: number
  top_dormant: DormantTopRow[]
}

const safeCount = async (table: 'dcli_activity' | 'ccm_activity' | 'scspa_activity'): Promise<number> => {
  try {
    const { count } = await supabase.from(table).select('id', { count: 'exact', head: true })
    return count ?? 0
  } catch {
    return 0
  }
}

const fetchDashboardData = async () => {
  // Fetch all parallel data to prevent waterfall
  const [
    { data: chassisData },
    { count: actCount },
    dcliCount,
    ccmCount,
    scspaCount,
  ] = await Promise.all([
    supabase.from('chassis_master').select('chassis_number, gps_provider'),
    supabase.from('mg_data').select('id', { count: 'exact', head: true }),
    safeCount('dcli_activity'),
    safeCount('ccm_activity'),
    safeCount('scspa_activity'),
  ]);

  const chassisRows = (chassisData ?? []) as ChassisMasterRow[];
  const total = chassisRows.length;
  const withGps = chassisRows.filter((r) => r.gps_provider != null && r.gps_provider !== '').length;

  const vendorData: VendorRow[] = [
    { vendor: 'DCLI', count: dcliCount },
    { vendor: 'CCM', count: ccmCount },
    { vendor: 'SCSPA', count: scspaCount },
  ];

  const gpsProviders = ['Samsara', 'BlackBerry', 'Fleetview', 'Fleetlocate', 'Anytrek'];
  const gpsData: GpsRow[] = gpsProviders.map((provider) => ({
    name: provider,
    value: chassisRows.filter((r) => r.gps_provider?.toLowerCase().includes(provider.toLowerCase())).length,
  }));

  return {
    chassisCount: total,
    gpsCoverage: total > 0 ? Math.round((withGps / total) * 100) : 0,
    recentActivityCount: actCount || 0,
    vendorData,
    gpsData
  };
};

export default function Dashboard() {
  // 1. Data Fetching Phase (React Query)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });

  const { data: rpcData, isLoading: rpcLoading } = useQuery({
    queryKey: ['dashboard-rpcs'],
    queryFn: async () => {
      const [unbilledRes, gapRes, dormantRes] = await Promise.all([
        supabase.rpc('get_unbilled_summary'),
        supabase.rpc('get_revenue_gap_summary', { p_months: null }),
        supabase.rpc('get_dormant_chassis_summary'),
      ])
      return {
        unbilled: (unbilledRes.data as UnbilledSummary | null),
        gap: (gapRes.data as GapSummary | null),
        dormant: (dormantRes.data as DormantSummary | null),
      }
    },
    staleTime: 1000 * 60 * 5
  })

  // 2. Analytics Tracking
  useEffect(() => {
    Analytics.track('dashboard_loaded', {
      cached: !!data
    });
  }, [data]);

  if (isError) {
    // Analytics error tracking handled implicitly by error boundary or manual track
    Analytics.track('validation_error', { source: 'dashboard_fetch' });
    return <div className="p-8 text-destructive font-bold">Error loading dashboard data. Please refresh.</div>;
  }

  const unbilledAtRisk = rpcData?.unbilled?.total_at_risk ?? 0
  const gapTotal = rpcData?.gap?.total_gap ?? 0
  const idleLeaseCost = rpcData?.dormant?.total_idle_lease_cost ?? 0
  const totalRatedM = ((rpcData?.gap?.total_rated ?? 0) / 1_000_000).toFixed(1)
  const topDormant = rpcData?.dormant?.top_dormant ?? []

  // Strict 8px grid system applied via standard Tailwind classes (p-8 = 32px, space-y-8 = 32px, gap-8 = 32px)
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Chassis Compass Navigator — Fleet Overview</p>
        <div className="pt-4">
          <DataFreshnessBar tableName="mg_data" label="TMS Data" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Chassis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
              <p className="text-4xl font-bold tracking-tight">{data?.chassisCount.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Active fleet units</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              GPS Coverage
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] cursor-help">?</span>
                </TooltipTrigger>
                <TooltipContent>Long-term chassis with a GPS provider assigned</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
              <p className="text-4xl font-bold tracking-tight">{`${data?.gpsCoverage}%`}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Visibility tracked</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">TMS Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
              <p className="text-4xl font-bold tracking-tight">{data?.recentActivityCount.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">Total MG loads recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Link to="/unbilled-loads" className="block hover:opacity-80 transition-opacity">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={14} />
                Unbilled Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rpcLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
                <p className={`text-4xl font-bold tracking-tight ${unbilledAtRisk > 0 ? 'text-red-600' : ''}`}>
                  {safeAmount(unbilledAtRisk)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {`${rpcData?.unbilled?.total_count ?? 0} loads · avg ${rpcData?.unbilled?.avg_days_since_drop ?? 0}d since drop`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/billing-exposure" className="block hover:opacity-80 transition-opacity">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingDown size={14} />
                Revenue Gap (All Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rpcLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
                <p className={`text-4xl font-bold tracking-tight ${gapTotal > 0 ? 'text-amber-600' : ''}`}>
                  {safeAmount(gapTotal)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {`${rpcData?.gap?.gap_pct ?? 0}% of $${totalRatedM}M rated`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/utilization" className="block hover:opacity-80 transition-opacity">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Timer size={14} />
                Idle Lease Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rpcLoading ? <Skeleton className="h-10 w-24 rounded" /> : (
                <p className={`text-4xl font-bold tracking-tight ${idleLeaseCost > 0 ? 'text-orange-600' : ''}`}>
                  {safeAmount(idleLeaseCost)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {`${rpcData?.dormant?.dormant_count ?? 0} dormant · ${rpcData?.dormant?.idle_count ?? 0} idle · avg ${rpcData?.dormant?.avg_days_idle_dormant ?? 0}d`}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg">Vendor Record Counts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full rounded-md" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data?.vendorData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="vendor" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-8} />
                  <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" name="Records" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg">GPS Provider Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[240px] w-full rounded-md" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data?.gpsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {data?.gpsData?.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {topDormant.length > 0 && (
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Top Dormant Chassis — Lease Cost Accruing
              <Link to="/utilization" className="text-sm font-normal text-blue-600 hover:underline">
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Lessor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Days Idle</TableHead>
                  <TableHead>Daily Rate</TableHead>
                  <TableHead>Idle Cost</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDormant.slice(0, 5).map((row) => {
                  const daysClass = row.days_idle > 90
                    ? 'text-red-600'
                    : row.days_idle > 60
                      ? 'text-amber-600'
                      : ''
                  return (
                    <TableRow key={row.chassis_number}>
                      <TableCell className="font-medium">{row.chassis_number}</TableCell>
                      <TableCell>{row.lessor}</TableCell>
                      <TableCell>{row.region}</TableCell>
                      <TableCell className={daysClass}>{row.days_idle}</TableCell>
                      <TableCell>{safeAmount(row.lease_rate_per_day)}</TableCell>
                      <TableCell className="text-red-600">{safeAmount(row.idle_lease_cost)}</TableCell>
                      <TableCell>{row.last_activity_date}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
