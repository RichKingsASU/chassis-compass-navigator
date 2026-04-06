import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { QueryEmptyState } from '@/components/ui/QueryEmptyState'

interface PierSEvent {
  id: number
  Terminal: string
  EventDate: string
  EventTime: string
  ChassisNo: string
  ChassisOwner: string
  ContainerNo: string
  ContainerOwner: string
  EventDescription: string
  LicensePlate: string
  BookingNo: string
  Condition: string
  _source_file: string
}

const EVENT_COLOR: Record<string, string> = {
  Pickup: 'bg-blue-100 text-blue-800',
  Return: 'bg-green-100 text-green-800',
  'Flip/Transfer': 'bg-purple-100 text-purple-800',
  'Gate Out': 'bg-orange-100 text-orange-800',
  'Gate In': 'bg-teal-100 text-teal-800',
}

export default function TerminalEventsPage() {
  const [events, setEvents] = useState<PierSEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('pier_s_events')
          .select('*')
          .order('EventDate', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setEvents((data || []) as PierSEvent[])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load terminal events')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = search.trim()
    ? events.filter((e) => {
        const q = search.toLowerCase()
        return (
          e.ChassisNo?.toLowerCase().includes(q) ||
          e.ContainerNo?.toLowerCase().includes(q) ||
          e.BookingNo?.toLowerCase().includes(q) ||
          e.Terminal?.toLowerCase().includes(q)
        )
      })
    : events

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Terminal Events (Pier S)</h1>
          <p className="text-muted-foreground">Gate-in / gate-out activity from Pier S feeds</p>
        </div>
        <Badge variant="outline">{events.length} events loaded</Badge>
      </div>

      <Input
        placeholder="Search by chassis, container, booking, or terminal..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              Loading terminal events...
            </div>
          ) : error ? (
            <QueryEmptyState
              reason="query_error"
              errorMessage={`${error} — run scripts/parse_pier_s_events.py first`}
              entityName="terminal events"
            />
          ) : events.length === 0 ? (
            <QueryEmptyState reason="no_data" entityName="Pier S terminal events" />
          ) : filtered.length === 0 ? (
            <QueryEmptyState
              reason="no_results_for_filter"
              entityName="events"
              filterDescription={`No events matching "${search}"`}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Chassis</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>License</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">{event.EventDate}</TableCell>
                      <TableCell className="text-sm font-mono">{event.EventTime}</TableCell>
                      <TableCell className="text-sm text-gray-700 max-w-[160px] truncate">
                        {event.Terminal}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {event.ChassisNo}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {event.ChassisOwner?.trim() || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.ContainerNo?.trim() || '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            EVENT_COLOR[event.EventDescription] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {event.EventDescription}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">{event.BookingNo}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {event.LicensePlate}
                      </TableCell>
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
