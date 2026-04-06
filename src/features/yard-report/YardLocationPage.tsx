import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface YardLocationPageProps {
  locationFilter: string
  title: string
}

export default function YardLocationPage({ locationFilter, title }: YardLocationPageProps) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('lb_yard_current')
        .select('*')
        .or(`location_name.ilike.%${locationFilter}%,pickup_location.ilike.%${locationFilter}%`)
        .order('created_at', { ascending: false })
        .limit(500)
      if (cancelled) return
      if (error) setError(error.message)
      else setRows(data || [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [locationFilter])

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-8 text-center">Loading…</div>
          ) : error ? (
            <div className="text-destructive py-8 text-center">Error: {error}</div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No data for this location</div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c}>{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={r.id ?? i}>
                      {columns.map((c) => (
                        <TableCell key={c} className="text-xs">
                          {r[c] == null ? '' : String(r[c])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
