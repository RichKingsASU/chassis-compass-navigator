import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type InvoiceEvent, eventLabel, eventIcon } from '@/types/invoice'

export default function DCLIActivity() {
  const [events, setEvents] = useState<InvoiceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (fetchErr) throw fetchErr
        setEvents(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI Activity</h1>
        <p className="text-muted-foreground">Recent invoice events and status changes</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {loading ? (
        <p className="text-muted-foreground">Loading activity...</p>
      ) : (
        <Card>
          <CardHeader><CardTitle>Event Timeline ({events.length})</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {events.map(evt => (
                  <li key={evt.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <span className="text-lg">{eventIcon(evt.event_type)}</span>
                    <div className="flex-1">
                      <p className="font-medium">{eventLabel(evt)}</p>
                      {evt.note && <p className="text-muted-foreground mt-0.5">{evt.note}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(evt.created_at).toLocaleString()}
                        {evt.created_by_email && ` by ${evt.created_by_email}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
