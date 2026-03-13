import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProviderCount {
  provider: string
  count: number
  last_upload: string
  route: string
  description: string
}

const GPS_PROVIDERS = [
  { provider: 'Samsara', route: '/gps/samsara', description: 'Samsara Fleet Telematics' },
  { provider: 'BlackBerry', route: '/gps/blackberry', description: 'BlackBerry Radar Asset Tracking' },
  { provider: 'Fleetview', route: '/gps/fleetview', description: 'Fleetview GPS Tracking' },
  { provider: 'Fleetlocate', route: '/gps/fleetlocate', description: 'Fleetlocate Trailer Tracking' },
  { provider: 'Anytrek', route: '/gps/anytrek', description: 'Anytrek GPS Solutions' },
]

export default function GpsOverview() {
  const [providerData, setProviderData] = useState<ProviderCount[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase.from('gps_uploads').select('provider, created_at')
        const uploads = data || []
        setTotalRecords(uploads.length)

        const merged = GPS_PROVIDERS.map(p => {
          const matching = uploads.filter((u: { provider: string; created_at: string }) =>
            u.provider?.toLowerCase() === p.provider.toLowerCase()
          )
          const latest = matching.sort((a: { created_at: string }, b: { created_at: string }) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          return {
            ...p,
            count: matching.length,
            last_upload: latest?.created_at || '',
          }
        })
        setProviderData(merged)
      } catch {
        setProviderData(GPS_PROVIDERS.map(p => ({ ...p, count: 0, last_upload: '' })))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GPS Overview</h1>
        <p className="text-muted-foreground">Monitor all GPS tracking providers and data uploads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total GPS Records</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalRecords}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{GPS_PROVIDERS.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Providers with Data</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{providerData.filter(p => p.count > 0).length}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground col-span-3">Loading...</p>
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded text-center">
                  <p className="text-2xl font-bold">{provider.count}</p>
                  <p className="text-xs text-muted-foreground">Total Uploads</p>
                </div>
                <div className="p-2 bg-blue-50 rounded text-center">
                  <p className="text-xs font-medium text-blue-700">Last Upload</p>
                  <p className="text-xs text-blue-600">{provider.last_upload ? formatDate(provider.last_upload) : 'Never'}</p>
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
