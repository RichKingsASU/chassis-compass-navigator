import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

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

export default function MercuryGate() {
  const {
    data, loading, error, totalCount, page, pageSize, totalPages,
    search, sortColumn, sortAscending, setPage, setSearch, setSort,
  } = useSupabaseTable({
    table: 'mg_data',
    pageSize: 50,
    searchColumns: [
      'ld_num', 'so_num', 'chassis_number', 'container_number',
      'carrier_name', 'acct_mgr_name', 'pickup_loc_name', 'drop_loc_name', 'mbl',
    ],
    defaultSort: { column: 'created_at', ascending: false },
  })

  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalCount)

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mercury Gate TMS</h1>
          <p className="text-muted-foreground">MercuryGate Transportation Management System data</p>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{totalCount.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current Page</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{data.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{new Set(data.map(r => r.chassis_number as string).filter(Boolean)).size}</p></CardContent>
          </Card>
        </div>

        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search LD#, SO#, chassis, container, carrier, account mgr, MBL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-64 px-3 py-2 border rounded-md text-sm"
          />
          <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            {loading ? <p className="text-muted-foreground">Loading TMS data...</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHead label="LD #" tooltip="ld_num" column="ld_num" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="SO #" tooltip="so_num" column="so_num" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Account Mgr" tooltip="acct_mgr_name" column="acct_mgr_name" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Status" tooltip="status" column="status" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Container #" tooltip="container_number" column="container_number" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Chassis #" tooltip="chassis_number" column="chassis_number" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Carrier" tooltip="carrier_name" column="carrier_name" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="SCAC" tooltip="carrier_scac" column="carrier_scac" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Pickup Location" tooltip="pickup_loc_name" column="pickup_loc_name" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Drop Location" tooltip="drop_loc_name" column="drop_loc_name" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Created" tooltip="createdate" column="createdate" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Pickup Date" tooltip="pickup_actual_date" column="pickup_actual_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Drop Date" tooltip="drop_actual_date" column="drop_actual_date" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Cust Rate" tooltip="customer_rate_amount" column="customer_rate_amount" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Cust Invoice" tooltip="customer_inv_amount" column="customer_inv_amount" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Carrier Rate" tooltip="carrier_rate_amount" column="carrier_rate_amount" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="Margin" tooltip="margin_rate" column="margin_rate" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="SSL" tooltip="steamshipline" column="steamshipline" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                      <SortableHead label="MBL" tooltip="mbl" column="mbl" currentSort={sortColumn} ascending={sortAscending} onSort={setSort} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow><TableCell colSpan={19} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : data.map((r, i) => (
                      <TableRow key={(r.id as string) || i}>
                        <TableCell className="font-mono text-sm">{(r.ld_num as string) || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{(r.so_num as string) || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{(r.acct_mgr_name as string) || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{(r.status as string) || 'N/A'}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{(r.container_number as string) || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{(r.chassis_number as string) || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{(r.carrier_name as string) || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm">{(r.carrier_scac as string) || 'N/A'}</TableCell>
                        <TableCell className="text-sm max-w-36 truncate" title={(r.pickup_loc_name as string) || ''}>{(r.pickup_loc_name as string) || 'N/A'}</TableCell>
                        <TableCell className="text-sm max-w-36 truncate" title={(r.drop_loc_name as string) || ''}>{(r.drop_loc_name as string) || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.createdate as string)}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.pickup_actual_date as string)}</TableCell>
                        <TableCell className="text-sm">{formatDate(r.drop_actual_date as string)}</TableCell>
                        <TableCell className="text-sm font-mono">{r.customer_rate_amount ? `$${r.customer_rate_amount}` : 'N/A'}</TableCell>
                        <TableCell className="text-sm font-mono">{r.customer_inv_amount ? `$${r.customer_inv_amount}` : 'N/A'}</TableCell>
                        <TableCell className="text-sm font-mono">{r.carrier_rate_amount ? `$${r.carrier_rate_amount}` : 'N/A'}</TableCell>
                        <TableCell className="text-sm font-mono">{r.margin_rate ? `$${r.margin_rate}` : 'N/A'}</TableCell>
                        <TableCell className="text-sm">{(r.steamshipline as string) || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-sm max-w-32 truncate" title={(r.mbl as string) || ''}>{(r.mbl as string) || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
