import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Interfaces ──────────────────────────────────────────────

interface Chassis {
  chassis_number: string
  chassis_type: string | null
  chassis_status: string | null
  lessor: string | null
  region: string | null
  gps_provider: string | null
  current_rate_per_day: number | null
  serial_number: string | null
  on_hire_date: string | null
  off_hire_date: string | null
}

interface Load {
  ld_num: string
  so_num: string | null
  container_number: string | null
  container_description: string | null
  owner: string | null
  carrier_name: string | null
  carrier_scac: string | null
  pickup_loc_name: string | null
  pickup_loc_city: string | null
  pickup_loc_state: string | null
  drop_loc_name: string | null
  drop_loc_city: string | null
  drop_loc_state: string | null
  pickup_actual_date: string | null
  drop_actual_date: string | null
  customer_rate_amount: number | null
  carrier_rate_amount: number | null
  margin_rate: number | null
  miles: number | null
  status: string | null
  service_description: string | null
  mbl: string | null
  steamship_line: string | null
  create_date: string | null
}

// ── Helpers ─────────────────────────────────────────────────

function fmtLoc(loc: string | null, city: string | null, state: string | null) {
  if (loc) return loc
  if (city && state) return `${city}, ${state}`
  return city || state || 'N/A'
}

// ── Component ───────────────────────────────────────────────

export default function ChassisDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chassis, setChassis] = useState<Chassis | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return
      setLoading(true)
      try {
        // id is the chassis_number (URL param)
        const chassisNumber = decodeURIComponent(id).trim()

        const { data: chassisData, error: chassisErr } = await supabase
          .from('chassis_master')
          .select('*')
          .eq('chassis_number', chassisNumber)
          .single()

        if (chassisErr) throw chassisErr
        setChassis(chassisData)

        const { data: loadsData } = await supabase
          .from('mg_data')
          .select(
            'ld_num, so_num, status, owner, carrier_name, carrier_scac, ' +
            'pickup_loc_name, pickup_loc_city, pickup_loc_state, pickup_actual_date, ' +
            'drop_loc_name, drop_loc_city, drop_loc_state, drop_actual_date, ' +
            'container_number, container_description, mbl, steamship_line, service_description, ' +
            'miles, customer_rate_amount, carrier_rate_amount, margin_rate, create_date'
          )
          .ilike('chassis_number', `%${chassisNumber}%`)
          .order('pickup_actual_date', { ascending: false })
          .limit(50)

        setLoads(((loadsData || []) as unknown) as Load[])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (error) return <div className="p-6"><p className="text-destructive">{error}</p></div>
  if (!chassis) return <div className="p-6"><p className="text-destructive">Chassis not found.</p></div>

  const totalRevenue = loads.reduce((s, l) => s + (Number(l.customer_rate_amount) || 0), 0)
  const totalCarrierCost = loads.reduce((s, l) => s + (Number(l.carrier_rate_amount) || 0), 0)
  const netMargin = totalRevenue - totalCarrierCost

  return (
    <div className="p-6 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/chassis')} className="text-muted-foreground hover:text-foreground text-sm">
          &larr; Back to Chassis
        </button>
        <h1 className="text-3xl font-bold font-mono">{chassis.chassis_number}</h1>
        {chassis.chassis_type && <span className="text-muted-foreground text-sm">{chassis.chassis_type}</span>}
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Chassis Type</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.chassis_type || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant="outline">{chassis.chassis_status || 'N/A'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Lessor</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.lessor || 'N/A'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Daily Rate</CardTitle></CardHeader>
          <CardContent><p className="font-bold">{chassis.current_rate_per_day != null ? `$${chassis.current_rate_per_day}/day` : 'N/A'}</p></CardContent>
        </Card>
      </div>

      {/* ── Secondary info ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Loads</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{loads.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Margin</CardTitle></CardHeader>
          <CardContent><p className={`text-3xl font-bold ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netMargin)}</p></CardContent>
        </Card>
      </div>

      {/* ── Chassis info panel ── */}
      <Card>
        <CardHeader><CardTitle>Chassis Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="Serial Number" value={chassis.serial_number} mono />
            <Field label="Region" value={chassis.region} />
            <Field label="GPS Provider" value={chassis.gps_provider} />
            <Field label="On Hire Date" value={chassis.on_hire_date ? formatDate(chassis.on_hire_date) : null} />
            <Field label="Off Hire Date" value={chassis.off_hire_date ? formatDate(chassis.off_hire_date) : null} />
          </dl>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="loads">
        <TabsList>
          <TabsTrigger value="loads">Load History ({loads.length})</TabsTrigger>
        </TabsList>

        {/* ── Loads Tab ── */}
        <TabsContent value="loads" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Load History</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Load #</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Drop Location</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Drop Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Carrier Cost</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          No loads found for this chassis.
                        </TableCell>
                      </TableRow>
                    ) : loads.map((l) => {
                      const margin = (Number(l.customer_rate_amount) || 0) - (Number(l.carrier_rate_amount) || 0)
                      return (
                        <TableRow key={l.ld_num}>
                          <TableCell className="font-mono font-medium">{l.ld_num}</TableCell>
                          <TableCell className="font-mono text-xs">{l.container_number || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{fmtLoc(l.pickup_loc_name, l.pickup_loc_city, l.pickup_loc_state)}</TableCell>
                          <TableCell className="text-sm">{fmtLoc(l.drop_loc_name, l.drop_loc_city, l.drop_loc_state)}</TableCell>
                          <TableCell>{formatDate(l.pickup_actual_date)}</TableCell>
                          <TableCell>{formatDate(l.drop_actual_date)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.customer_rate_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(l.carrier_rate_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(margin)}</TableCell>
                          <TableCell><Badge variant="outline">{l.status || 'N/A'}</Badge></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Small helper component ──────────────────────────────────

function Field({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono font-medium' : 'font-medium'}>{value ?? 'N/A'}</dd>
    </div>
  )
}
