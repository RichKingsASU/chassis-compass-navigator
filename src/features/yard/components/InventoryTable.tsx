import { useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { YardStatusBadge } from '@/features/yard/statusBadge'
import { formatDate } from '@/utils/dateUtils'
import { AssignToLoadModal, GateOutModal, type YardInventoryRow } from './YardModals'

interface InventoryTableProps {
  rows: YardInventoryRow[]
  showYardColumn?: boolean
  yardNameById?: Record<string, string>
}

export default function InventoryTable({
  rows,
  showYardColumn = false,
  yardNameById = {},
}: InventoryTableProps) {
  const [assignTarget, setAssignTarget] = useState<YardInventoryRow | null>(null)
  const [gateOutTarget, setGateOutTarget] = useState<YardInventoryRow | null>(null)

  const daysInYard = (row: YardInventoryRow) => {
    if (!row.date_in) return '—'
    try {
      const d = parseISO(row.date_in)
      return differenceInCalendarDays(new Date(), d)
    } catch {
      return '—'
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No inventory"
        description="No chassis match the current filters or are currently in this yard."
      />
    )
  }

  return (
    <>
      <div className="rounded-md border max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Spot</TableHead>
              {showYardColumn && <TableHead>Yard</TableHead>}
              <TableHead>Chassis #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Container #</TableHead>
              <TableHead>Account Manager</TableHead>
              <TableHead>Planned Exit</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Inbound Date</TableHead>
              <TableHead className="text-right">Days in Yard</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const status = (r.status ?? '').toUpperCase()
              const isExited = !!r.actual_exit_at
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.spot ?? '—'}</TableCell>
                  {showYardColumn && (
                    <TableCell>{yardNameById[r.yard_id] ?? '—'}</TableCell>
                  )}
                  <TableCell className="font-mono font-medium">{r.chassis_number}</TableCell>
                  <TableCell>{r.chassis_type ?? '—'}</TableCell>
                  <TableCell>
                    <YardStatusBadge status={isExited ? 'EXITED' : status} />
                  </TableCell>
                  <TableCell className="font-mono">{r.container_number ?? '—'}</TableCell>
                  <TableCell>{r.account_manager ?? '—'}</TableCell>
                  <TableCell>{formatDate(r.planned_exit_date)}</TableCell>
                  <TableCell>
                    {r.planned_driver_name || r.inbound_driver_name || '—'}
                  </TableCell>
                  <TableCell>{formatDate(r.date_in)}</TableCell>
                  <TableCell className="text-right">{daysInYard(r)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {!isExited && status === 'EMPTY' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignTarget(r)}
                      >
                        Assign to Load
                      </Button>
                    )}
                    {!isExited && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGateOutTarget(r)}
                      >
                        Gate Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AssignToLoadModal
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
      <GateOutModal
        target={gateOutTarget}
        onClose={() => setGateOutTarget(null)}
      />
    </>
  )
}
