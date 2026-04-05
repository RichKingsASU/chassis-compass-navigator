import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PPRecord {
  [key: string]: unknown
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
          .from('ytd_loads')
          .select('*')
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
        setFiltered(data || [])
      } catch (err) {
        console.error('[PortPro] load failed:', err)
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
    const q = search.toUpperCase().trim()
    setFiltered(records.filter(r =>
      String(r.order_number || r.ld_num || '').toUpperCase().includes(q) ||
      String(r.chassis_number || '').toUpperCase().trim().includes(q) ||
      String(r.container_number || '').toUpperCase().includes(q) ||
      String(r.customer || r.customer_name || '').toUpperCase().includes(q)
    ))
  }, [search, records])

  // Detect columns dynamically from the data
  const columns = records.length > 0 ? Object.keys(records[0]).filter(k => k !== 'id' && !k.startsWith('_')) : []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Port Pro TMS</h1>
        <p className="text-muted-foreground">Port Pro Transportation Management System — YTD Loads</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

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
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Columns</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{columns.length}</p></CardContent>
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
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.slice(0, 10).map(col => (
                      <TableHead key={col}>{col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((r, i) => (
                    <TableRow key={i}>
                      {columns.slice(0, 10).map(col => (
                        <TableCell key={col} className="text-sm">
                          {r[col] != null ? String(r[col]) : 'N/A'}
                        </TableCell>
                      ))}
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
