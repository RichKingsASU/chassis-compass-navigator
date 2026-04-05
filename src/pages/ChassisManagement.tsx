import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

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

interface ShortTermChassis {
  id: number
  chassis_number: string
  status: string
  lessor: string
  on_hire_date: string
  off_hire_date: string
  rate_per_day: number
  paid_amount: number
  repair_costs: number
  [key: string]: unknown
}

export default function ChassisManagement() {
  const [longTerm, setLongTerm] = useState<LongTermChassis[]>([])
  const [shortTerm, setShortTerm] = useState<ShortTermChassis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedChassis, setSelectedChassis] = useState<LongTermChassis | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [ltRes, stRes] = await Promise.all([
          supabase.from('long_term_lease_owned').select('*').order('chassis_number').limit(500),
          supabase.from('short_term_lease').select('*').order('chassis_number').limit(500),
        ])
        if (ltRes.error) throw ltRes.error
        if (stRes.error) throw stRes.error
        setLongTerm(ltRes.data || [])
        setShortTerm(stRes.data || [])
      } catch (err) {
        console.error('[ChassisManagement] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const total = longTerm.length + shortTerm.length
  const active = longTerm.filter(c => !c.status?.toLowerCase().includes('offhired')).length
    + shortTerm.filter(c => !c.status?.toLowerCase().includes('offhired')).length
  const available = total - active

  const filteredLT = search
    ? longTerm.filter(c => c.chassis_number?.toUpperCase().includes(search.toUpperCase().trim()))
    : longTerm
  const filteredST = search
    ? shortTerm.filter(c => c.chassis_number?.toUpperCase().includes(search.toUpperCase().trim()))
    : shortTerm

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chassis Management</h1>
        <p className="text-muted-foreground">Fleet chassis inventory and status tracking</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{total.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active / In Use</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{active}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-600">{available}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      <Tabs defaultValue="long-term">
        <TabsList>
          <TabsTrigger value="long-term">Long Term ({longTerm.length})</TabsTrigger>
          <TabsTrigger value="short-term">Short Term ({shortTerm.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="long-term">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
              ) : filteredLT.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No chassis found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chassis #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lessor</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>GPS Provider</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLT.slice(0, 100).map(c => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedChassis(c)}
                        >
                          <TableCell className="font-mono font-medium">{c.chassis_number?.trim()}</TableCell>
                          <TableCell><Badge variant="outline">{c.status || 'N/A'}</Badge></TableCell>
                          <TableCell className="text-sm">{c.lessor || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{c.category || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{c.region || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{c.gps_provider || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredLT.length > 100 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filteredLT.length} chassis.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="short-term">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
              ) : filteredST.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No short term chassis found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chassis #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Lessor</TableHead>
                        <TableHead>On Hire</TableHead>
                        <TableHead>Off Hire</TableHead>
                        <TableHead>Rate/Day</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Repair Costs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredST.slice(0, 100).map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono font-medium">{c.chassis_number?.trim()}</TableCell>
                          <TableCell><Badge variant="outline">{c.status || 'N/A'}</Badge></TableCell>
                          <TableCell className="text-sm">{c.lessor || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{safeDate(c.on_hire_date)}</TableCell>
                          <TableCell className="text-sm">{safeDate(c.off_hire_date)}</TableCell>
                          <TableCell className="text-sm">{safeAmount(c.rate_per_day)}</TableCell>
                          <TableCell className="text-sm">{safeAmount(c.paid_amount)}</TableCell>
                          <TableCell className="text-sm">{safeAmount(c.repair_costs)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Long Term Detail Drawer */}
      <Sheet open={!!selectedChassis} onOpenChange={() => setSelectedChassis(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedChassis?.chassis_number?.trim()}</SheetTitle>
            <SheetDescription>Long Term Chassis Details</SheetDescription>
          </SheetHeader>
          {selectedChassis && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-6">
              <Field label="Chassis #" value={selectedChassis.chassis_number?.trim()} />
              <Field label="Status" value={selectedChassis.status} />
              <Field label="Category" value={selectedChassis.category} />
              <Field label="Lessor" value={selectedChassis.lessor} />
              <Field label="Type" value={selectedChassis.type} />
              <Field label="Region" value={selectedChassis.region} />
              <Field label="Rate/Day" value={safeAmount(selectedChassis.rate_per_day)} />
              <Field label="GPS Provider" value={selectedChassis.gps_provider} />
              <Field label="On Hire" value={safeDate(selectedChassis.on_hire_date)} />
              <Field label="Off Hire" value={safeDate(selectedChassis.off_hire_date)} />
              <Field label="Contract Status" value={selectedChassis.contract_status} />
              <Field label="Notes" value={selectedChassis.notes} />
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value ?? 'N/A'}</dd>
    </div>
  )
}
