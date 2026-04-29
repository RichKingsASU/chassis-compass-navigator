import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { safeDate, safeAmount } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useQuery } from '@tanstack/react-query'

// chassis_master columns
interface ChassisMaster {
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
  [key: string]: unknown
}

function getStatusVariant(status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status?.toLowerCase() || ''
  if (s.includes('active') || s.includes('on hire') || s.includes('in use')) return 'default'
  if (s.includes('available')) return 'secondary'
  if (s.includes('off') || s.includes('maintenance')) return 'destructive'
  return 'outline'
}

export default function ChassisManagement() {
  const [search, setSearch] = useState('')
  const [selectedChassis, setSelectedChassis] = useState<ChassisMaster | null>(null)
  
  // Pagination states
  const [overviewPage, setOverviewPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Reset pagination when search changes
  useEffect(() => {
    setOverviewPage(1)
    setAllPage(1)
  }, [search])

  const { data: chassis = [], isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['chassis_master'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chassis_master')
        .select('*')
        .order('chassis_number')
        .limit(1000)
      if (error) throw error
      return data || []
    }
  })

  const error = fetchError ? (fetchError as Error).message : null

  const totalChassis = chassis.length
  const activeChassis = chassis.filter(c => !c.chassis_status?.toLowerCase().includes('off')).length
  const availableChassis = totalChassis - activeChassis

  const filtered = search
    ? chassis.filter(c =>
        c.chassis_number?.trim().toUpperCase().includes(search.toUpperCase()) ||
        c.lessor?.toUpperCase().includes(search.toUpperCase())
      )
    : chassis

  // Pagination logic
  const totalOverviewPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedOverview = filtered.slice((overviewPage - 1) * ITEMS_PER_PAGE, overviewPage * ITEMS_PER_PAGE)

  const totalAllPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedAll = filtered.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Chassis Management</h1>
        <p className="text-muted-foreground mt-2">Fleet chassis inventory and status tracking</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Chassis</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalChassis.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active / In Use</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-green-600">{activeChassis}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-blue-600">{availableChassis}</p>}</CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input 
          type="text" 
          placeholder="Search chassis number or lessor..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="flex-1 min-w-48 px-4 py-2 border rounded-md text-sm" 
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all">All Chassis ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Chassis Inventory</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chassis #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Lessor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>GPS Provider</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOverview.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground h-24">No records found.</TableCell></TableRow>
                        ) : paginatedOverview.map(c => (
                          <TableRow key={c.chassis_number} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedChassis(c)}>
                            <TableCell className="font-mono font-medium">{c.chassis_number?.trim()}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(c.chassis_status)}>{c.chassis_status || 'N/A'}</Badge></TableCell>
                            <TableCell>{c.lessor || 'N/A'}</TableCell>
                            <TableCell>{c.chassis_type || 'N/A'}</TableCell>
                            <TableCell>{c.region || 'N/A'}</TableCell>
                            <TableCell>{c.gps_provider || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filtered.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min((overviewPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(overviewPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} chassis
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOverviewPage(p => Math.max(1, p - 1))} disabled={overviewPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setOverviewPage(p => Math.min(totalOverviewPages, p + 1))} disabled={overviewPage === totalOverviewPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chassis #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Lessor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Rate/Day</TableHead>
                          <TableHead>GPS Provider</TableHead>
                          <TableHead>On Hire</TableHead>
                          <TableHead>Off Hire</TableHead>
                          <TableHead>Serial #</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAll.length === 0 ? (
                          <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground h-24">No records found.</TableCell></TableRow>
                        ) : paginatedAll.map(c => (
                          <TableRow key={c.chassis_number} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedChassis(c)}>
                            <TableCell className="font-mono font-medium">{c.chassis_number?.trim()}</TableCell>
                            <TableCell><Badge variant={getStatusVariant(c.chassis_status)}>{c.chassis_status || 'N/A'}</Badge></TableCell>
                            <TableCell>{c.lessor || 'N/A'}</TableCell>
                            <TableCell>{c.chassis_type || 'N/A'}</TableCell>
                            <TableCell>{c.region || 'N/A'}</TableCell>
                            <TableCell>{safeAmount(c.current_rate_per_day)}</TableCell>
                            <TableCell>{c.gps_provider || 'N/A'}</TableCell>
                            <TableCell>{safeDate(c.on_hire_date)}</TableCell>
                            <TableCell>{safeDate(c.off_hire_date)}</TableCell>
                            <TableCell className="font-mono text-xs">{c.serial_number || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {filtered.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min((allPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)} to {Math.min(allPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} chassis
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAllPage(p => Math.max(1, p - 1))} disabled={allPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setAllPage(p => Math.min(totalAllPages, p + 1))} disabled={allPage === totalAllPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedChassis} onOpenChange={open => { if (!open) setSelectedChassis(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedChassis?.chassis_number?.trim()}</SheetTitle>
            <SheetDescription>Chassis Details</SheetDescription>
          </SheetHeader>
          {selectedChassis && (
            <div className="mt-8 space-y-6">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
                <DetailField label="Chassis #" value={selectedChassis.chassis_number?.trim()} />
                <DetailField label="Status" value={selectedChassis.chassis_status} />
                <DetailField label="Lessor" value={selectedChassis.lessor} />
                <DetailField label="Type" value={selectedChassis.chassis_type} />
                <DetailField label="Region" value={selectedChassis.region} />
                <DetailField label="Rate/Day" value={safeAmount(selectedChassis.current_rate_per_day)} />
                <DetailField label="GPS Provider" value={selectedChassis.gps_provider} />
                <DetailField label="Serial #" value={selectedChassis.serial_number} />
                <DetailField label="On Hire" value={safeDate(selectedChassis.on_hire_date)} />
                <DetailField label="Off Hire" value={safeDate(selectedChassis.off_hire_date)} />
              </dl>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium mt-1">{value || 'N/A'}</dd>
    </div>
  )
}
