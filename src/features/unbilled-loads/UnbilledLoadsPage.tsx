import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowUpDown,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Download,
  CheckCircle2,
  Eye,
  Inbox,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { UnbilledLoad } from '@/types/operations'
import { safeAmount } from '@/lib/formatters'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { exportToExcel } from '@/utils/exportUtils'

interface VUnbilledLoadRow {
  id: string
  ld_num: string | null
  acct_mgr: string | null
  carrier_name: string | null
  pickup_region: string | null
  drop_region: string | null
  pickup_actual_date: string | null
  create_date: string | null
  drop_actual_date: string | null
  status: string | null
  customer_rate_amount: number | null
  customer_inv_amount: number | null
  revenue_at_risk: number | null
  chassis_number: string | null
  container_number: string | null
  unbilled_reason: string | null
}

export default function UnbilledLoadsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  const searchFilter = searchParams.get('q') || ''

  const { data: realData, isLoading } = useQuery<VUnbilledLoadRow[]>({
    queryKey: ['v_unbilled_loads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_unbilled_loads').select('*')
      if (error) throw error
      return (data ?? []) as VUnbilledLoadRow[]
    },
  })

  const data: UnbilledLoad[] = React.useMemo(() => {
    if (!realData || realData.length === 0) return []
    return realData.map((r) => ({
      id: r.id,
      loadNumber: r.ld_num || 'N/A',
      customer: r.acct_mgr || 'Unknown',
      carrier: r.carrier_name || 'N/A',
      lane: `${r.pickup_region || '??'} -> ${r.drop_region || '??'}`,
      pickupDate: r.pickup_actual_date || r.create_date || '',
      deliveryDate: r.drop_actual_date || '',
      status: r.status || 'Unknown',
      billableAmount: r.customer_rate_amount || 0,
      expectedRevenue: r.customer_rate_amount || 0,
      actualRevenue: r.customer_inv_amount || 0,
      revenueGap: r.revenue_at_risk || 0,
      chassisNumber: r.chassis_number,
      containerNumber: r.container_number,
      notes: r.unbilled_reason,
    }))
  }, [realData])

  const columns: ColumnDef<UnbilledLoad>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="flex items-center justify-center w-6 h-6 hover:bg-muted rounded"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      accessorKey: 'loadNumber',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Load #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono">{row.getValue('loadNumber')}</div>,
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
    },
    {
      accessorKey: 'lane',
      header: 'Lane',
    },
    {
      accessorKey: 'pickupDate',
      header: 'Pickup',
      cell: ({ row }) => {
        const date = row.getValue('pickupDate') as string
        return date ? new Date(date).toLocaleDateString() : '—'
      },
    },
    {
      accessorKey: 'revenueGap',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Revenue Gap
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('revenueGap'))
        return <div className="text-right font-medium text-destructive">{safeAmount(amount)}</div>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return <Badge variant={status === 'Delivered' ? 'default' : 'outline'}>{status}</Badge>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const load = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(load.loadNumber)}>
                Copy Load ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Ready to Bill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const totalAtRisk = data.reduce((sum, item) => sum + item.revenueGap, 0)
  const avgGap = data.length > 0 ? totalAtRisk / data.length : 0

  const handleExport = () => {
    const selectedRows = data.filter((_, index) => rowSelection[index])
    const exportData = selectedRows.length > 0 ? selectedRows : data
    exportToExcel(exportData, `Unbilled_Loads_${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unbilled Loads</h1>
          <p className="text-muted-foreground">
            Manage loads that are delivered but not yet invoiced.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {Object.keys(rowSelection).length > 0
              ? `Export Selected (${Object.keys(rowSelection).length})`
              : 'Export All'}
          </Button>
          <Button disabled={data.length === 0}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Batch Bill
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          Loading unbilled loads…
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No unbilled loads"
          description="No records returned from v_unbilled_loads. Loads delivered but not invoiced will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total At Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{safeAmount(totalAtRisk)}</div>
                <p className="text-xs text-muted-foreground">Across {data.length} loads</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Gap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeAmount(avgGap)}</div>
                <p className="text-xs text-muted-foreground">Per unbilled load</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ready to Bill
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.filter((d) => !d.notes).length}
                </div>
                <p className="text-xs text-muted-foreground">No missing documentation</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <DataTable
                columns={columns}
                data={data}
                searchKey="loadNumber"
                searchValue={searchFilter}
                onSearchChange={(val) => {
                  if (val) {
                    setSearchParams({ q: val })
                  } else {
                    setSearchParams({})
                  }
                }}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowCanExpand={() => true}
                renderSubComponent={({ row }) => (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Carrier:</span> {row.original.carrier}
                      </div>
                      <div>
                        <span className="font-semibold">Chassis:</span>{' '}
                        {row.original.chassisNumber || '—'}
                      </div>
                      <div>
                        <span className="font-semibold">Container:</span>{' '}
                        {row.original.containerNumber || '—'}
                      </div>
                      <div>
                        <span className="font-semibold">Delivery Date:</span>{' '}
                        {row.original.deliveryDate
                          ? new Date(row.original.deliveryDate).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                    {row.original.notes && (
                      <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded text-xs border border-destructive/20">
                        <span className="font-bold uppercase mr-2">Blocker:</span>{' '}
                        {row.original.notes}
                      </div>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
