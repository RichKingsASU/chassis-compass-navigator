import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useBCExport, type BCExportLineItem } from '@/hooks/useBCExport'
import { formatShortDate, formatUSD } from '@/features/dcli/format'

interface BCExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorKey: string
  invoiceId: string
  activityTable: string
  lineItems: BCExportLineItem[]
  onExported?: () => void
}

export function BCExportDialog({
  open,
  onOpenChange,
  vendorKey,
  invoiceId,
  activityTable,
  lineItems,
  onExported,
}: BCExportDialogProps) {
  const { exporting, exportLines } = useBCExport({ vendorKey, invoiceId, activityTable })
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [confirmedMissingSO, setConfirmedMissingSO] = useState(false)

  useEffect(() => {
    if (!open) return
    const initial: Record<string, boolean> = {}
    for (const l of lineItems) {
      initial[l.id] = !l.bc_exported
    }
    setSelected(initial)
    setConfirmedMissingSO(false)
  }, [open, lineItems])

  const selectedLines = useMemo(
    () => lineItems.filter((l) => selected[l.id]),
    [lineItems, selected]
  )

  const totalAmount = useMemo(
    () =>
      selectedLines.reduce(
        (sum, l) => sum + (typeof l.total === 'number' ? l.total : Number(l.total ?? 0)),
        0
      ),
    [selectedLines]
  )

  const missingSOCount = useMemo(
    () => selectedLines.filter((l) => !l.so_num || String(l.so_num).trim() === '').length,
    [selectedLines]
  )

  const allSelected =
    lineItems.length > 0 && lineItems.every((l) => selected[l.id])

  function toggleAll() {
    if (allSelected) {
      setSelected({})
    } else {
      const next: Record<string, boolean> = {}
      for (const l of lineItems) next[l.id] = true
      setSelected(next)
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleExport() {
    if (selectedLines.length === 0) return
    if (missingSOCount > 0 && !confirmedMissingSO) {
      setConfirmedMissingSO(true)
      return
    }
    const result = await exportLines(selectedLines)
    if (result.success) {
      onExported?.()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export to Business Central</DialogTitle>
          <DialogDescription>
            Select line items to include in the BC import file.
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs sticky top-0">
                <tr>
                  <th className="px-2 py-2 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="px-2 py-2 text-left">Chassis</th>
                  <th className="px-2 py-2 text-left">Date In</th>
                  <th className="px-2 py-2 text-left">SO #</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((l) => {
                  const isChecked = !!selected[l.id]
                  const missingSO = !l.so_num || String(l.so_num).trim() === ''
                  return (
                    <tr key={l.id} className="border-t">
                      <td className="px-2 py-1.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(l.id)}
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">{l.chassis ?? '—'}</td>
                      <td className="px-2 py-1.5">{formatShortDate(l.date_in) || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">
                        {l.so_num || (
                          <span className="text-amber-700 italic">missing</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">
                        {formatUSD(l.total) || '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {l.bc_exported ? (
                          <span className="px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
                            Previously exported
                            {l.bc_exported_at
                              ? ` ${formatShortDate(l.bc_exported_at)}`
                              : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {missingSO && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                            no SO
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                      No line items available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {selectedLines.length} line item{selectedLines.length === 1 ? '' : 's'} ·{' '}
            <span className="font-mono">
              {formatUSD(totalAmount) || '$0.00'}
            </span>{' '}
            total
          </div>
          {missingSOCount > 0 && (
            <div className="flex items-center gap-1 text-amber-700 text-xs">
              <AlertTriangle size={14} />
              {missingSOCount} missing SO #
            </div>
          )}
        </div>

        {missingSOCount > 0 && confirmedMissingSO && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            {missingSOCount} line item{missingSOCount === 1 ? '' : 's'} are missing SO numbers.
            These will export with SO# blank. Run "Validate Invoice" first to populate SO numbers
            from TMS data, or click Export again to proceed anyway.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedLines.length === 0}
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {missingSOCount > 0 && !confirmedMissingSO ? 'Continue' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
