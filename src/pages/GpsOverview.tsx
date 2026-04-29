import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { Map } from 'lucide-react'

interface ProviderRow {
  provider: string
  route: string
  description: string
  count: number
  last_ping: string
  has_coords: number
  dormant_count: number
}

const GPS_PROVIDERS = [
  { provider: 'Samsara',          route: '/gps/samsara',     description: 'Samsara Fleet Telematics' },
  { provider: 'BlackBerry Radar', route: '/gps/blackberry',  description: 'BlackBerry Radar Asset Tracking' },
  { provider: 'Fleetview',        route: '/gps/fleetview',   description: 'Fleetview GPS Tracking' },
  { provider: 'Fleetlocate',      route: '/gps/fleetlocate', description: 'Fleetlocate Trailer Tracking' },
  { provider: 'Anytrek',          route: '/gps/anytrek',     description: 'Anytrek GPS Solutions' },
]

interface UnifiedRow {
  gps_source: string
  chassis_number: string
  gps_date: string
  gps_status: string | null
  dormant_days: number | null
  latitude: number | null
  longitude: number | null
}

interface LandmarkRow {
  name: string
  lat: number
  lon: number
  source: string
}

export default function GpsOverview() {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['gps_providers_overview_v2'],
    queryFn: async () => {
      const [gpsRes, landmarkRes] = await Promise.all([
        supabase
          .from('v_chassis_gps_unified')
          .select('gps_source, chassis_number, gps_date, gps_status, dormant_days, latitude, longitude'),
        supabase
          .from('landmark_coords')
          .select('name, lat, lon, source'),
      ])
      if (gpsRes.error) throw gpsRes.error
      const pings = (gpsRes.data || []) as UnifiedRow[]
      const landmarks = (landmarkRes.data || []) as LandmarkRow[]

      const SOURCE_MAP: Record<string, string> = {
        'Samsara':          'SAMSARA',
        'BlackBerry Radar': 'BLACKBERRY_LOG',
        'Fleetview':        'FLEETVIEW',
        'Fleetlocate':      'FLEETLOCATE',
        'Anytrek':          'ANYTREK',
      }

      const merged: ProviderRow[] = GPS_PROVIDERS.map(p => {
        const source = SOURCE_MAP[p.provider] || p.provider.toUpperCase()
        const matching = pings.filter(r => r.gps_source === source)
        const latest = [...matching].sort((a, b) =>
          new Date(b.gps_date).getTime() - new Date(a.gps_date).getTime()
        )[0]
        return {
          ...p,
          count: matching.length,
          last_ping: latest?.gps_date || '',
          has_coords: matching.filter(r => r.latitude && r.longitude).length,
          dormant_count: matching.filter(r => (Number(r.dormant_days) || 0) >= 3).length,
        }
      })

      return {
        providerData: merged,
        totalRecords: pings.length,
        totalWithCoords: pings.filter(r => r.latitude && r.longitude).length,
        uniqueChassis: new Set(pings.map(r => r.chassis_number)).size,
        landmarkCount: landmarks.length,
      }
    },
  })

  const providerData = data?.providerData ?? []
  const totalRecords = data?.totalRecords ?? 0
  const totalWithCoords = data?.totalWithCoords ?? 0
  const uniqueChassis = data?.uniqueChassis ?? 0
  const landmarkCount = data?.landmarkCount ?? 0

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">GPS Overview</h1>
          <p className="text-muted-foreground mt-2">Monitor all GPS tracking providers and data uploads</p>
        </div>
        <Link to="/gps/fleet-map">
          <Button size="lg" className="gap-2">
            <Map className="h-4 w-4" />
            View Fleet Map →
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total GPS Records</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Chassis with Coords</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{totalWithCoords.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{uniqueChassis.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Named Landmarks</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-24" /> : <p className="text-3xl font-bold">{landmarkCount.toLocaleString()}</p>}</CardContent>
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-emerald-50 rounded text-center">
                  <p className="text-xl font-bold text-emerald-700">{provider.has_coords.toLocaleString()}</p>
                  <p className="text-xs text-emerald-700">With Coords</p>
                </div>
                <div className="p-3 bg-amber-50 rounded text-center">
                  <p className="text-xl font-bold text-amber-700">{provider.dormant_count.toLocaleString()}</p>
                  <p className="text-xs text-amber-700">Dormant 3d+</p>
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
