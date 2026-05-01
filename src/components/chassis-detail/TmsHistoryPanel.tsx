import { Fragment, useState } from 'react'
import { History, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDatePT, formatCurrency } from './format'
import type { LoadRow } from './types'

interface Props {
  loads: LoadRow[]
  loading: boolean
}

const FIELD_GROUPS: { title: string; fields: { key: keyof LoadRow; label: string; format?: 'date' | 'currency' }[] }[] = [
  {
    title: 'Dates & Cycle',
    fields: [
      { key: 'created_date', label: 'Created', format: 'date' },
      { key: 'pickup_actual_date', label: 'Pickup', format: 'date' },
      { key: 'delivery_actual_date', label: 'Delivery', format: 'date' },
    ],
  },
  {
    title: 'Financial',
    fields: [
      { key: 'cust_rate_charge', label: 'Customer Rate', format: 'currency' },
      { key: 'cust_invoice_charge', label: 'Customer Invoice', format: 'currency' },
      { key: 'carrier_rate_charge', label: 'Carrier Rate', format: 'currency' },
      { key: 'carrier_invoice_charge', label: 'Carrier Invoice', format: 'currency' },
      { key: 'zero_rev', label: 'Zero Revenue Flag' },
    ],
  },
  {
    title: 'References',
    fields: [
      { key: 'mbl', label: 'MBL' },
      { key: 'container_number', label: 'Container #' },
      { key: 'container_type', label: 'Container Type' },
      { key: 'so_num', label: 'SO #' },
    ],
  },
  {
    title: 'Carrier',
    fields: [
      { key: 'carrier_name', label: 'Carrier Name' },
      { key: 'service', label: 'Service' },
      { key: 'miles', label: 'Miles' },
    ],
  },
]

function fmt(value: unknown, format?: 'date' | 'currency'): string {
  if (value == null || value === '') return '—'
  if (format === 'date') return formatDatePT(String(value))
  if (format === 'currency') return formatCurrency(Number(value))
  return String(value)
}

export default function TmsHistoryPanel({ loads, loading }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Load History
          </span>
          {!loading && (
            <span className="text-xs text-muted-foreground font-normal">
              {loads.length} loads on record for this chassis
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : loads.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No loads found for this chassis.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border max-h-[380px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs w-6"></TableHead>
                  <TableHead className="text-xs">Load #</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Origin</TableHead>
                  <TableHead className="text-xs">Destination</TableHead>
                  <TableHead className="text-xs">Pickup</TableHead>
                  <TableHead className="text-xs">Delivery</TableHead>
                  <TableHead className="text-xs text-right">Cust Rate</TableHead>
                  <TableHead className="text-xs text-right">Carrier Rate</TableHead>
                  <TableHead className="text-xs text-right">Miles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loads.map((l, i) => {
                  const id = (l.ld_num || `r-${i}`) as string
                  const isOpen = expanded === id
                  return (
                    <Fragment key={id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setExpanded(isOpen ? null : id)}
                      >
                        <TableCell className="text-xs">
                          {isOpen ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{l.ld_num || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {l.status ? (
                            <Badge variant="outline" className="text-[10px]">
                              {l.status}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{l.customer_name || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {l.pickup_loc_name ||
                            [l.pickup_city, l.pickup_state].filter(Boolean).join(', ') ||
                            '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {l.delivery_loc_name ||
                            [l.delivery_city, l.delivery_state].filter(Boolean).join(', ') ||
                            '—'}
                        </TableCell>
                        <TableCell className="text-xs">{formatDatePT(l.pickup_actual_date)}</TableCell>
                        <TableCell className="text-xs">{formatDatePT(l.delivery_actual_date)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(l.cust_rate_charge)}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(l.carrier_rate_charge)}</TableCell>
                        <TableCell className="text-xs text-right">{l.miles ?? '—'}</TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={11} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              {FIELD_GROUPS.map((g) => (
                                <div key={g.title}>
                                  <p className="font-semibold text-muted-foreground mb-1.5">
                                    {g.title}
                                  </p>
                                  <dl className="space-y-1">
                                    {g.fields.map((f) => (
                                      <div key={String(f.key)} className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">{f.label}</dt>
                                        <dd className="font-medium text-right truncate max-w-[60%]">
                                          {fmt(l[f.key], f.format)}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
