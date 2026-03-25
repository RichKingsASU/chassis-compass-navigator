import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getChassisUnified } from '@/services/chassisService'
import type { ChassisUnifiedRow } from '@/types/chassis'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [chassis, setChassis] = useState<ChassisUnifiedRow[]>([])
  const [filtered, setFiltered] = useState<ChassisUnifiedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getChassisUnified()
        setChassis(data)
        setFiltered(data)
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
      result = result.filter(c =>
        c.chassis_number?.toUpperCase().includes(q) ||
        c.customer_name?.toUpperCase().includes(q) ||
        c.latest_dcli_location?.toUpperCase().includes(q)
      )
    }
    if (statusFilter !== 'all') result = result.filter(c => c.chassis_status?.toLowerCase() === statusFilter)
    if (typeFilter !== 'all') result = result.filter(c => c.chassis_type === typeFilter)
    setFiltered(result)
  }, [search, statusFilter, typeFilter, chassis])

  const types = [...new Set(chassis.map(c => c.chassis_type).filter(Boolean))] as string[]
  const total = chassis.length
  const active = chassis.filter(c => ['active', 'in_use'].includes(c.chassis_status?.toLowerCase() ?? '')).length
  const available = chassis.filter(c => c.chassis_status?.toLowerCase() === 'available').length

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
          placeholder="Search chassis #, customer, or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
        <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading chassis data...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Load Status</TableHead>
                    <TableHead className="text-right">Total Loads</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead>Last Load</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No chassis found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(c => (
                    <TableRow key={c.chassis_id}>
                      <TableCell className="font-mono font-medium">{c.chassis_number}</TableCell>
                      <TableCell className="text-sm">{c.chassis_type || 'N/A'}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(c.chassis_status || '')}>{c.chassis_status || 'Unknown'}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{c.customer_name || '—'}</TableCell>
                      <TableCell className="text-sm">{c.latest_load_status || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.total_loads ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(c.total_revenue)}</TableCell>
                      <TableCell className="text-sm">{formatDate(c.last_load_date)}</TableCell>
                      <TableCell>
                        <Link to={`/chassis/${c.chassis_id}`}><Button variant="outline" size="sm">View</Button></Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 100 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} chassis.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
