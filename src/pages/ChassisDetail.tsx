import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface LongTermChassis {
  id: number
  chassis_number: string
  status: string
  category: string
  lessor: string
  type: string
  region: string
  rate_per_day: number
  gps_provider: string
  on_hire_date: string
  off_hire_date: string
  contract_status: string
  notes: string
  [key: string]: unknown
}

interface TMSLoad {
  id: number
  ld_num: string
  container_number: string
  customer_name: string
  carrier_name: string
  pickup_actual_date: string
  delivery_actual_date: string
  cust_rate_charge: number
  carrier_rate_charge: number
  status: string
}

interface YardEvent {
  id: number
  [key: string]: unknown
}

export default function ChassisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chassis, setChassis] = useState<LongTermChassis | null>(null)
  const [loads, setLoads] = useState<TMSLoad[]>([])
  const [yardEvents, setYardEvents] = useState<YardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('long_term_lease_owned')
          .select('*')
          .eq('id', Number(id))
          .single()
        if (fetchErr) throw fetchErr
        setChassis(data)

        const cn = (data.chassis_number || '').trim()
        if (cn) {
          const [loadsRes, yardRes] = await Promise.all([
            supabase.from('mg_tms').select('*').ilike('chassis_number', `%${cn}%`).order('pickup_actual_date', { ascending: false }).limit(100),
            supabase.from('yard_events_data').select('*').ilike('"ChassisNo"', `%${cn}%`).limit(50),
          ])
          setLoads(loadsRes.data || [])
          setYardEvents(yardRes.data || [])
        }
      } catch (err) {
        console.error('[ChassisDetail] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" /></div>
  if (!chassis) return <div className="p-6"><p className="text-destructive">Chassis not found.</p></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chassis')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back</button>
        <h1 className="text-3xl font-bold font-mono">{chassis.chassis_number?.trim()}</h1>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent><Badge>{chassis.status || 'N/A'}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lessor</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.lessor || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">GPS Provider</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.gps_provider || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{loads.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="loads">Loads ({loads.length})</TabsTrigger>
          <TabsTrigger value="yard">Yard Events ({yardEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Chassis Info</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Chassis #" value={chassis.chassis_number?.trim()} />
                <Field label="Status" value={chassis.status} />
                <Field label="Category" value={chassis.category} />
                <Field label="Lessor" value={chassis.lessor} />
                <Field label="Type" value={chassis.type} />
                <Field label="Region" value={chassis.region} />
                <Field label="Rate/Day" value={safeAmount(chassis.rate_per_day)} />
                <Field label="GPS Provider" value={chassis.gps_provider} />
                <Field label="On Hire" value={formatDate(chassis.on_hire_date)} />
                <Field label="Off Hire" value={formatDate(chassis.off_hire_date)} />
                <Field label="Contract Status" value={chassis.contract_status} />
                <Field label="Notes" value={chassis.notes} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loads" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Load History</CardTitle></CardHeader>
            <CardContent>
              {loads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No loads found for this chassis.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Load #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Cust Rate</TableHead>
                        <TableHead>Carrier Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loads.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-sm">{l.ld_num}</TableCell>
                          <TableCell className="text-sm">{l.customer_name || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{l.carrier_name || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{formatDate(l.pickup_actual_date)}</TableCell>
                          <TableCell className="text-sm">{formatDate(l.delivery_actual_date)}</TableCell>
                          <TableCell className="text-sm">{safeAmount(l.cust_rate_charge)}</TableCell>
                          <TableCell className="text-sm">{safeAmount(l.carrier_rate_charge)}</TableCell>
                          <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yard" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Yard Events</CardTitle></CardHeader>
            <CardContent>
              {yardEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No yard events found for this chassis.</p>
              ) : (
                <p className="text-muted-foreground">{yardEvents.length} yard events found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? 'N/A'}</dd>
    </div>
  )
}
