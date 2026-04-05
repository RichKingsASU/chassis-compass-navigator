import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PPRecord {
  id: string
  order_number: string
  chassis_number: string
  container_number: string
  pickup_date: string
  delivery_date: string
  carrier: string
  customer: string
  terminal: string
  status: string
  created_at: string
}

export default function PortPro() {
  const [records, setRecords] = useState<PPRecord[]>([])
  const [filtered, setFiltered] = useState<PPRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('portpro_tms')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
        setFiltered(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load Port Pro data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!search) {
      setFiltered(records)
      return
    }
    const q = search.toUpperCase()
    setFiltered(records.filter(r =>
      r.order_number?.includes(q) ||
      r.chassis_number?.includes(q) ||
      r.container_number?.includes(q) ||
      r.customer?.toUpperCase().includes(q) ||
      r.carrier?.toUpperCase().includes(q) ||
      r.terminal?.toUpperCase().includes(q)
    ))
  }, [search, records])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Port Pro TMS</h1>
        <p className="text-muted-foreground">Port Pro Transportation Management System — Port drayage data</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{records.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Filtered</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{filtered.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{new Set(records.map(r => r.chassis_number).filter(Boolean)).size}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search order#, chassis, container, customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading Port Pro data...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Container #</TableHead>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Pickup Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {records.length === 0 && !search
                        ? 'No Port Pro data imported yet.'
                        : 'No records match your search.'}
                    </TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.order_number || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.chassis_number || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.terminal || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.pickup_date)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.delivery_date)}</TableCell>
                      <TableCell className="text-sm">{r.carrier || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.customer || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} records.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
