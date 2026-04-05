import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ChassisEntry {
  chassis_number: string
  gps_provider: string
  status: string
  region: string
}

export default function ChassisLocator() {
  const [chassis, setChassis] = useState<ChassisEntry[]>([])
  const [filtered, setFiltered] = useState<ChassisEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [gpsFilter, setGpsFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('long_term_lease_owned')
          .select('chassis_number, gps_provider, status, region')
          .limit(500)
        if (fetchErr) throw fetchErr
        setChassis(data || [])
        setFiltered(data || [])
      } catch (err) {
        console.error('[ChassisLocator] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = chassis
    if (search) result = result.filter(c => c.chassis_number?.toUpperCase().trim().includes(search.toUpperCase().trim()))
    if (gpsFilter !== 'all') result = result.filter(c => c.gps_provider === gpsFilter)
    setFiltered(result)
  }, [search, gpsFilter, chassis])

  const gpsProviders = [...new Set(chassis.map(c => c.gps_provider).filter(Boolean))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Locator</h1>
        <p className="text-muted-foreground">Chassis fleet with GPS provider assignments</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>GPS Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border rounded-lg bg-muted/30">
            <p className="text-lg font-medium text-muted-foreground">No GPS coordinates available yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Import GPS data via GPS Providers to see locations on the map.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis #..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Select value={gpsFilter} onValueChange={setGpsFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="GPS Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All GPS Providers</SelectItem>
            {gpsProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setGpsFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fleet Chassis</CardTitle>
            <Badge variant="outline">{filtered.length} results</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No chassis found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>GPS Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((c, i) => (
                  <TableRow key={`${c.chassis_number}-${i}`}>
                    <TableCell className="font-mono font-medium">{c.chassis_number?.trim()}</TableCell>
                    <TableCell><Badge variant="outline">{c.gps_provider || 'None'}</Badge></TableCell>
                    <TableCell className="text-sm">{c.status || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{c.region || 'N/A'}</TableCell>
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
