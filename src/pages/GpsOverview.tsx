import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'

interface ProviderCount {
  provider: string
  count: number
  last_ping: string
  route: string
  description: string
}

const GPS_PROVIDERS = [
  { provider: 'Samsara',          route: '/gps/samsara',    description: 'Samsara Fleet Telematics' },
  { provider: 'BlackBerry Radar', route: '/gps/blackberry', description: 'BlackBerry Radar Asset Tracking' },
  { provider: 'Fleetview',        route: '/gps/fleetview',  description: 'Fleetview GPS Tracking' },
  { provider: 'Fleetlocate',      route: '/gps/fleetlocate',description: 'Fleetlocate Trailer Tracking' },
  { provider: 'Anytrek',          route: '/gps/anytrek',    description: 'Anytrek GPS Solutions' },
]

export default function GpsOverview() {
  const { data: { providerData, totalRecords } = { providerData: [], totalRecords: 0 }, isLoading: loading } = useQuery({
    queryKey: ['gps_providers_overview'],
    queryFn: async () => {
      // Get total GPS ping count from gps_data
      const { count } = await supabase
        .from('gps_data')
        .select('*', { count: 'exact', head: true })
      
      const total = count ?? 0

      // Get all pings with provider + recorded_at for per-provider stats
      // Note: As data scales, this should ideally be an RPC aggregate function
      const { data } = await supabase
        .from('gps_data')
        .select('provider, recorded_at')
        .order('recorded_at', { ascending: false })
        
      const pings = data || []

      const merged = GPS_PROVIDERS.map(p => {
        const matching = pings.filter(
          (row: { provider: string | null }) => row.provider === p.provider
        )
        const latest = matching[0] as { recorded_at: string } | undefined
        return {
          ...p,
          count: matching.length,
          last_ping: latest?.recorded_at || '',
        }
      })

      return { providerData: merged, totalRecords: total }
    }
  })

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">GPS Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor all GPS tracking providers and data uploads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total GPS Records</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{GPS_PROVIDERS.length}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Providers with Data</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{providerData.filter(p => p.count > 0).length}</p>}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(GPS_PROVIDERS.length)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : providerData.map(provider => (
          <Card key={provider.provider} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{provider.provider}</CardTitle>
                <Badge variant={provider.count > 0 ? 'default' : 'outline'}>
                  {provider.count > 0 ? 'Active' : 'No Data'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded text-center">
                  <p className="text-2xl font-bold">{provider.count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Pings</p>
                </div>
                <div className="p-3 bg-blue-50 rounded text-center">
                  <p className="text-xs font-medium text-blue-700">Last Ping</p>
                  <p className="text-xs text-blue-600">{provider.last_ping ? formatDate(provider.last_ping) : 'Never'}</p>
                </div>
              </div>
              <Link to={provider.route}>
                <Button className="w-full" variant="outline">View Provider</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
