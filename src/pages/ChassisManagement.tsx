import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Chassis {
  id: string
  chassis_number: string
  provider: string
  status: string
  type: string
  year: number
  location: string
  last_seen: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'active': return 'default'
    case 'available': return 'secondary'
    case 'in_use': return 'default'
    case 'maintenance': return 'destructive'
    case 'retired': return 'outline'
    default: return 'outline'
  }
}

export default function ChassisManagement() {
  const [chassis, setChassis] = useState<Chassis[]>([])
  const [filtered, setFiltered] = useState<Chassis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('chassis')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setChassis(data || [])
        setFiltered(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = chassis
    if (search) {
      const q = search.toUpperCase()
      result = result.filter(c => c.chassis_number?.includes(q) || c.location?.toUpperCase().includes(q))
    }
    if (providerFilter !== 'all') result = result.filter(c => c.provider === providerFilter)
    if (statusFilter !== 'all') result = result.filter(c => c.status?.toLowerCase() === statusFilter)
    setFiltered(result)
  }, [search, providerFilter, statusFilter, chassis])

  const providers = [...new Set(chassis.map(c => c.provider).filter(Boolean))]
  const total = chassis.length
  const active = chassis.filter(c => ['active', 'in_use'].includes(c.status?.toLowerCase())).length
  const available = chassis.filter(c => c.status?.toLowerCase() === 'available').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Management</h1>
        <p className="text-muted-foreground">Fleet chassis inventory and status tracking</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{total.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active / In Use</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{active}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-600">{available}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis number or location..."
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setProviderFilter('all'); setStatusFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading chassis data...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No chassis found.</TableCell></TableRow>
                ) : filtered.slice(0, 100).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.chassis_number}</TableCell>
                    <TableCell><Badge variant="outline">{c.provider || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-sm">{c.type || 'N/A'}</TableCell>
                    <TableCell>{c.year || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{c.location || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.last_seen)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status || 'Unknown'}</Badge></TableCell>
                    <TableCell>
                      <Link to={`/chassis/${c.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 100 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} chassis.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
