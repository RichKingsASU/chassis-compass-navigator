import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import GoogleMapsFleetMap from '@/components/GoogleMapsFleetMap'

interface ChassisLocation {
  id: string
  chassis_number: string
  latitude: number
  longitude: number
  location_name: string
  provider: string
  gps_provider: string
  timestamp: string
  status: string
}

export default function ChassisLocator() {
  const [locations, setLocations] = useState<ChassisLocation[]>([])
  const [filtered, setFiltered] = useState<ChassisLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [gpsFilter, setGpsFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('samsara_gps')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        const normalised = (data || []).map((d: Record<string, unknown>) => ({ ...d, timestamp: d.recorded_at })) as ChassisLocation[]
        setLocations(normalised)
        setFiltered(normalised)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load location data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = locations
    if (search) result = result.filter(l => l.chassis_number?.includes(search.toUpperCase()) || l.location_name?.toUpperCase().includes(search.toUpperCase()))
    if (providerFilter !== 'all') result = result.filter(l => l.provider === providerFilter)
    if (gpsFilter !== 'all') result = result.filter(l => l.gps_provider === gpsFilter)
    setFiltered(result)
  }, [search, providerFilter, gpsFilter, locations])

  const providers = [...new Set(locations.map(l => l.provider).filter(Boolean))]
  const gpsProviders = [...new Set(locations.map(l => l.gps_provider).filter(Boolean))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Locator</h1>
        <p className="text-muted-foreground">Real-time chassis locations from GPS providers</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">
          Unable to load GPS data — check console
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fleet Map</CardTitle>
            <Badge variant="outline">{filtered.filter(l => l.latitude && l.longitude).length} locations on map</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[480px] rounded-lg overflow-hidden">
            <GoogleMapsFleetMap locations={filtered} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis # or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gpsFilter} onValueChange={setGpsFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="GPS Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All GPS</SelectItem>
            {gpsProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setProviderFilter('all'); setGpsFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chassis Locations</CardTitle>
            <Badge variant="outline">{filtered.length} results</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading location data...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>GPS Provider</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No GPS data available yet.</p>
                      <a href="/gps" className="text-sm text-primary underline mt-1 inline-block">Import GPS data via the GPS Providers section.</a>
                    </TableCell>
                  </TableRow>
                ) : filtered.slice(0, 100).map(loc => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-mono font-medium">{loc.chassis_number}</TableCell>
                    <TableCell className="text-sm">{loc.location_name || 'Unknown'}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                    </TableCell>
                    <TableCell><Badge variant="outline">{loc.gps_provider || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-sm">{loc.provider || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{formatDate(loc.timestamp)}</TableCell>
                    <TableCell><Badge variant={loc.status === 'moving' ? 'default' : 'secondary'}>{loc.status || 'N/A'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
