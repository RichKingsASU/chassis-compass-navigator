import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Chassis {
  id: string
  chassis_number: string
  provider: string
  status: string
  type: string
  year: number
  vin: string
  plate: string
  location: string
  last_seen: string
  gps_provider: string
  created_at: string
}

interface GpsRecord {
  id: string
  latitude: number
  longitude: number
  timestamp: string
  speed: number
  status: string
  location_name: string
}

interface InvoiceLine {
  id: string
  provider: string
  invoice_number: string
  pickup_date: string
  return_date: string
  days: number
  amount: number
  status: string
}

export default function ChassisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chassis, setChassis] = useState<Chassis | null>(null)
  const [gpsHistory, setGpsHistory] = useState<GpsRecord[]>([])
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase.from('chassis').select('*').eq('id', id).single()
        if (fetchErr) throw fetchErr
        setChassis(data)

        const [gpsRes, invRes] = await Promise.all([
          supabase.from('gps_data').select('*').eq('chassis_number', data.chassis_number).order('timestamp', { ascending: false }).limit(50),
          supabase.from('invoice_lines').select('*').eq('chassis_number', data.chassis_number).order('pickup_date', { ascending: false }).limit(50),
        ])
        setGpsHistory(gpsRes.data || [])
        setInvoiceLines(invRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!chassis) return <div className="p-6"><p className="text-destructive">Chassis not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chassis')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back to Chassis</button>
        <h1 className="text-3xl font-bold font-mono">{chassis.chassis_number}</h1>
        <Badge variant="outline">{chassis.status}</Badge>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Provider</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.provider || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Type</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.type || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Year</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.year || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">GPS Provider</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.gps_provider || 'N/A'}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="gps">GPS History</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Lines</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Chassis Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-muted-foreground">Chassis #</p><p className="font-mono font-medium">{chassis.chassis_number}</p></div>
                <div><p className="text-muted-foreground">VIN</p><p className="font-mono">{chassis.vin || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Plate</p><p>{chassis.plate || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Provider</p><p>{chassis.provider || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Type</p><p>{chassis.type || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Year</p><p>{chassis.year || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Location</p><p>{chassis.location || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Last Seen</p><p>{formatDate(chassis.last_seen)}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant="outline">{chassis.status || 'N/A'}</Badge></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gps" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>GPS Position History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gpsHistory.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No GPS history.</TableCell></TableRow>
                  ) : gpsHistory.map(g => (
                    <TableRow key={g.id}>
                      <TableCell>{formatDate(g.timestamp)}</TableCell>
                      <TableCell className="text-sm">{g.location_name || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-mono">{g.latitude?.toFixed(5)}, {g.longitude?.toFixed(5)}</TableCell>
                      <TableCell>{g.speed ? `${g.speed} mph` : 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{g.status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Invoice Line History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Return</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceLines.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No invoice history.</TableCell></TableRow>
                  ) : invoiceLines.map(line => (
                    <TableRow key={line.id}>
                      <TableCell><Badge variant="outline">{line.provider}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{line.invoice_number}</TableCell>
                      <TableCell>{formatDate(line.pickup_date)}</TableCell>
                      <TableCell>{formatDate(line.return_date)}</TableCell>
                      <TableCell>{line.days}</TableCell>
                      <TableCell>${line.amount?.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline">{line.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
