import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DataFreshnessBar from '@/components/DataFreshnessBar'
import { Analytics } from '@/utils/analytics'
import { Skeleton } from '@/components/ui/skeleton'

interface VendorRow { vendor: string; count: number }
interface GpsRow { name: string; value: number }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface ChassisMasterRow { chassis_number: string | null; gps_provider: string | null }

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
    </div>
  )
}

