import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface YardDetailProps {
  yardId: 'PIER S' | 'JED YARD'
}

const COLUMNS = [
  'ChassisNo',
  'EventDate',
  'EventTime',
  'EventDescription',
  'ContainerNo',
  'Condition',
] as const

export default function YardDetail({ yardId }: YardDetailProps) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setHasError(false)
      try {
        const { data, error } = await supabase
          .from('yard_events_data')
          .select(COLUMNS.map((c) => `"${c}"`).join(','))
          .eq('Terminal', yardId)
          .order('EventDate', { ascending: false })
          .limit(500)
        if (cancelled) return
        if (error) {
          setHasError(true)
          setRows([])
        } else {
          setRows(data || [])
        }
      } catch {
        if (!cancelled) {
          setHasError(true)
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [yardId])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">{yardId}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Yard Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground py-8 text-center">Loading…</div>
          ) : hasError || rows.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No events found for this yard
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((c) => (
                      <TableHead key={c}>{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      {COLUMNS.map((c) => (
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
