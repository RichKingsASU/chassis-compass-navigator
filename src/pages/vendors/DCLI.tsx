import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// dcli_activity actual columns
interface DcliRecord {
  id: string
  chassis: string
  reservation_number: string
  date_out: string
  date_in: string
  days_out: number
  pick_up_location: string
  location_in: string
  pool_contract: string
  container: string
  ss_scac: string
  request_status: string
  motor_carrier_name: string
  market: string
  region: string
  [key: string]: unknown
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'closed': case 'completed': return 'default'
    case 'open': case 'active': return 'secondary'
    default: return 'outline'
  }
}

export default function DCLIPage() {
  const [records, setRecords] = useState<DcliRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setRecords(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalRecords = records.length

  const filtered = search
    ? records.filter(r => {
        const q = search.toUpperCase().trim()
        return r.chassis?.trim().toUpperCase().includes(q) || r.reservation_number?.toUpperCase().includes(q)
      })
    : records

  // Status breakdown
  const statusGroups = new Map<string, number>()
  for (const r of records) {
    const s = r.request_status || 'Not Set'
    statusGroups.set(s, (statusGroups.get(s) || 0) + 1)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI</h1>
        <p className="text-muted-foreground">Direct ChassisLink Inc. — Vendor Dashboard</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="activity">Activity ({totalRecords})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalRecords}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
              <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{new Set(records.map(r => r.chassis?.trim()).filter(Boolean)).size}</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Statuses</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from(statusGroups.entries()).map(([status, count]) => (
                    <Badge key={status} variant={getStatusVariant(status)}>{status}: {count}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> Direct ChassisLink Inc. (DCLI)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.dcli.com" className="text-primary underline" target="_blank" rel="noreferrer">www.dcli.com</a></p>
                <p><span className="font-medium">Phone:</span> 1-800-227-3254</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Dispute Deadline</p>
                  <p className="text-sm text-yellow-700">All disputes must be filed within 30 days of invoice date.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">DCLI Activity</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} records</p>
          </div>
          <input type="text" placeholder="Search chassis or reservation..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Reservation</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Pick Up</TableHead>
                    <TableHead>Location In</TableHead>
                    <TableHead>Pool/Contract</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.chassis?.trim() || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.reservation_number || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_out)}</TableCell>
                      <TableCell className="text-sm">{safeDate(r.date_in)}</TableCell>
                      <TableCell>{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.pick_up_location || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.location_in || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.pool_contract || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.motor_carrier_name || 'N/A'}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(r.request_status)}>{r.request_status || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
