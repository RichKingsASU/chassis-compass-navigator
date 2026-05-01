import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDatePT } from './format'
import type { DcliRow } from './types'

interface Props {
  rows: DcliRow[]
  loading: boolean
}

export default function VendorActivityCard({ rows, loading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Vendor / Lessor Activity (DCLI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No DCLI activity on record for this chassis.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date Out</TableHead>
                  <TableHead className="text-xs">Date In</TableHead>
                  <TableHead className="text-xs">Pick-up Location</TableHead>
                  <TableHead className="text-xs">Location In</TableHead>
                  <TableHead className="text-xs text-right">Days Out</TableHead>
                  <TableHead className="text-xs">Container</TableHead>
                  <TableHead className="text-xs">SS Line</TableHead>
                  <TableHead className="text-xs">Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{formatDatePT(r.date_out)}</TableCell>
                    <TableCell className="text-xs">{formatDatePT(r.date_in)}</TableCell>
                    <TableCell className="text-xs">{r.pick_up_location || '—'}</TableCell>
                    <TableCell className="text-xs">{r.location_in || '—'}</TableCell>
                    <TableCell className="text-xs text-right">{r.days_out ?? '—'}</TableCell>
                    <TableCell className="text-xs">{r.container || '—'}</TableCell>
                    <TableCell className="text-xs">{r.ss_scac || '—'}</TableCell>
                    <TableCell className="text-xs">{r.reservation || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 italic">
          SCSPA, CCM, TRAC, FLEXIVAN, WCCP activity panels coming when those pipelines are
          live.
        </p>
      </CardContent>
    </Card>
  )
}
