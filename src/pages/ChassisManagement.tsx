import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

// --- Overview tab types & helpers ---

interface Chassis {
  id: string
  chassis_number: string
  provider: string
  status: string
  type: string
  year: number
  location: string
  last_seen: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'active': return 'default'
    case 'available': return 'secondary'
    case 'in_use': return 'default'
    case 'maintenance': return 'destructive'
    case 'retired': return 'outline'
    default: return 'outline'
  }
}

// --- Sortable header helper ---

function SortableHead({ label, tooltip, column, currentSort, ascending, onSort }: {
  label: string
  tooltip?: string
  column: string
  currentSort: string | null
  ascending: boolean
  onSort: (col: string) => void
}) {
  const active = currentSort === column
  const inner = (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      {active && <span className="text-xs">{ascending ? '↑' : '↓'}</span>}
    </button>
  )

  if (tooltip) {
    return (
      <TableHead>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent><p className="text-xs">Column: {tooltip}</p></TooltipContent>
        </Tooltip>
      </TableHead>
    )
  }
  return <TableHead>{inner}</TableHead>
}

// --- Pagination controls ---

function PaginationControls({ page, totalPages, totalCount, pageSize, setPage }: {
  page: number; totalPages: number; totalCount: number; pageSize: number; setPage: (p: number) => void
}) {
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalCount)
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {totalCount > 0 ? from : 0}–{to} of {totalCount.toLocaleString()}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="flex items-center text-sm text-muted-foreground">
          Page {page + 1} of {totalPages || 1}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// =======================
// Overview Tab (existing)
// =======================

function OverviewTab() {
  const [chassis, setChassis] = useState<Chassis[]>([])
  const [filtered, setFiltered] = useState<Chassis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('chassis')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setChassis(data || [])
        setFiltered(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load chassis data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = chassis
    if (search) {
      const q = search.toUpperCase()
      result = result.filter(c => c.chassis_number?.includes(q) || c.location?.toUpperCase().includes(q))
    }
    if (providerFilter !== 'all') result = result.filter(c => c.provider === providerFilter)
    if (statusFilter !== 'all') result = result.filter(c => c.status?.toLowerCase() === statusFilter)
    setFiltered(result)
  }, [search, providerFilter, statusFilter, chassis])

  const providers = [...new Set(chassis.map(c => c.provider).filter(Boolean))]
  const total = chassis.length
  const active = chassis.filter(c => ['active', 'in_use'].includes(c.status?.toLowerCase())).length
  const available = chassis.filter(c => c.status?.toLowerCase() === 'available').length

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

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
          placeholder="Search chassis number or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setProviderFilter('all'); setStatusFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading chassis data...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No chassis found.</TableCell></TableRow>
                ) : filtered.slice(0, 100).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.chassis_number}</TableCell>
                    <TableCell><Badge variant="outline">{c.provider || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-sm">{c.type || 'N/A'}</TableCell>
                    <TableCell>{c.year || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{c.location || 'N/A'}</TableCell>
                    <TableCell className="text-sm">{formatDate(c.last_seen)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status || 'Unknown'}</Badge></TableCell>
                    <TableCell>
                      <Link to={`/chassis/${c.id}`}><Button variant="outline" size="sm">View</Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 100 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} chassis.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

// =============================
// Long Term / Owned Tab
// =============================

function LongTermOwnedTab() {
  const {
    data, loading, error, totalCount, page, pageSize, totalPages,
    search, sortColumn, sortAscending, setPage, setSearch, setSort,
  } = useSupabaseTable({
    table: 'long_term_lease_owned',
    pageSize: 50,
    searchColumns: ['forrest_chz', 'lessor', 'region', 'chassis_category', 'gps_provider', 'contract'],
    defaultSort: { column: 'created_at', ascending: false },
  })

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Units</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalCount.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis #, lessor, region, GPS provider..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm"
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading long term lease data...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Chassis #" tooltip="forrest_chz" column="forrest_chz" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Status" tooltip="chassis_status" column="chassis_status" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Category" tooltip="chassis_category" column="chassis_category" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Lessor" tooltip="lessor" column="lessor" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Type" tooltip="forrest_chassis_type" column="forrest_chassis_type" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Region" tooltip="region" column="region" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Rate/Day" tooltip="current_rate_per_day" column="current_rate_per_day" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="GPS Provider" tooltip="gps_provider" column="gps_provider" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="On Hire" tooltip="forrest_on_hire_date" column="forrest_on_hire_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Off Hire" tooltip="forrest_off_hire_date" column="forrest_off_hire_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Contract Status" tooltip="contract_status" column="contract_status" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : data.map((r, i) => (
                    <TableRow key={(r.id as string) || i}>
                      <TableCell className="font-mono font-medium">{(r.forrest_chz as string) || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{(r.chassis_status as string) || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-sm">{(r.chassis_category as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.lessor as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.forrest_chassis_type as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.region as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-mono">{r.current_rate_per_day ? `$${r.current_rate_per_day}` : 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.gps_provider as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.forrest_on_hire_date as string)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.forrest_off_hire_date as string)}</TableCell>
                      <TableCell><Badge variant="outline">{(r.contract_status as string) || 'N/A'}</Badge></TableCell>
                      <TableCell className="text-sm max-w-40 truncate" title={(r.notes as string) || ''}>{(r.notes as string) || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} setPage={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================
// Short Term Lease Tab
// =============================

function ShortTermLeaseTab() {
  const {
    data, loading, error, totalCount, page, pageSize, totalPages,
    search, sortColumn, sortAscending, setPage, setSearch, setSort,
  } = useSupabaseTable({
    table: 'short_term_lease',
    pageSize: 50,
    searchColumns: ['all_units_on_hired_june_2024_present', 'booking', 'location', 'size_type'],
    defaultSort: { column: 'created_at', ascending: false },
  })

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Leases</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalCount.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis #, booking, location, size/type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm"
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading short term lease data...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Chassis #" tooltip="all_units_on_hired_june_2024_present" column="all_units_on_hired_june_2024_present" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Booking" tooltip="booking" column="booking" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="On Hire" tooltip="on_hire_date" column="on_hire_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Off Hire" tooltip="off_hire_date" column="off_hire_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Rate/Day" tooltip="rate_per_day" column="rate_per_day" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Size / Type" tooltip="size_type" column="size_type" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Location" tooltip="location" column="location" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Paid Amount" tooltip="paid_amount_w_tax" column="paid_amount_w_tax" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Days Out" tooltip="days_out" column="days_out" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <SortableHead label="Repair Costs" tooltip="repair_costs_billed_by_milestone" column="repair_costs_billed_by_milestone" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                  ) : data.map((r, i) => (
                    <TableRow key={(r.id as string) || i}>
                      <TableCell className="font-mono font-medium">{(r.all_units_on_hired_june_2024_present as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.booking as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.on_hire_date as string)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.off_hire_date as string)}</TableCell>
                      <TableCell className="text-sm font-mono">{r.rate_per_day ? `$${r.rate_per_day}` : 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.size_type as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.location as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-mono">{r.paid_amount_w_tax ? `$${r.paid_amount_w_tax}` : 'N/A'}</TableCell>
                      <TableCell className="text-sm">{(r.days_out as string) || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-mono">{r.repair_costs_billed_by_milestone ? `$${r.repair_costs_billed_by_milestone}` : 'N/A'}</TableCell>
                      <TableCell className="text-sm max-w-40 truncate" title={(r.notes as string) || ''}>{(r.notes as string) || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls page={page} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} setPage={setPage} />
        </CardContent>
      </Card>
    </div>
  )
}

// =============================
// Main Page
// =============================

export default function ChassisManagement() {
  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Chassis Management</h1>
          <p className="text-muted-foreground">Fleet chassis inventory, leases, and status tracking</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="long-term">Long Term / Owned</TabsTrigger>
            <TabsTrigger value="short-term">Short Term Lease</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="long-term">
            <LongTermOwnedTab />
          </TabsContent>
          <TabsContent value="short-term">
            <ShortTermLeaseTab />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
