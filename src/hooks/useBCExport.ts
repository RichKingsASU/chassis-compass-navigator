import { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface VendorBCConfig {
  id?: number
  vendor_key: string
  vendor_display_name: string
  bc_company: string
  bc_type: string
  bc_gl_account: string
  bc_state: string
  bc_ops_center: string
  bc_division: string
  bc_department: string
  bc_description_template: string
  bc_quantity: number
  is_active: boolean
}

export interface BCExportLineItem {
  id: string
  chassis: string | null
  date_in: string | null
  total: number | null
  so_num?: string | null
  bc_exported?: boolean | null
  bc_exported_at?: string | null
}

export interface UseBCExportOptions {
  vendorKey: string
  invoiceId: string
  activityTable: string
}

export interface BCExportResult {
  success: boolean
  fileName?: string
  exportedCount: number
  totalAmount: number
  error?: string
}

function formatDateMDY(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function formatYMDCompact(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export function buildDescription(
  template: string,
  config: Pick<VendorBCConfig, 'vendor_display_name'>,
  line: BCExportLineItem
): string {
  const dateIn = formatDateMDY(line.date_in)
  return template
    .replaceAll('{vendor}', config.vendor_display_name)
    .replaceAll('{date_in}', dateIn)
    .replaceAll('{chassis}', (line.chassis ?? '').trim())
    .replaceAll('{so_num}', line.so_num ?? '')
}

export function buildBCRow(config: VendorBCConfig, line: BCExportLineItem) {
  const description = buildDescription(config.bc_description_template, config, line)
  return {
    Company: config.bc_company,
    Type: config.bc_type,
    'No.': config.bc_gl_account,
    'Description/Comment': description,
    Quantity: config.bc_quantity,
    'Direct Unit Cost Excl. Tax': typeof line.total === 'number' ? line.total : Number(line.total ?? 0),
    State: config.bc_state,
    'Ops Center': config.bc_ops_center,
    Division: config.bc_division,
    Department: config.bc_department,
  }
}

export function useBCExport({ vendorKey, invoiceId, activityTable }: UseBCExportOptions) {
  const [exporting, setExporting] = useState(false)

  const fetchConfig = useCallback(async (): Promise<VendorBCConfig | null> => {
    const { data, error } = await supabase
      .from('vendor_bc_config')
      .select('*')
      .eq('vendor_key', vendorKey)
      .maybeSingle()
    if (error) throw error
    return (data ?? null) as VendorBCConfig | null
  }, [vendorKey])

  const exportLines = useCallback(
    async (selectedLines: BCExportLineItem[]): Promise<BCExportResult> => {
      setExporting(true)
      let fileName = ''
      let totalAmount = 0
      try {
        const config = await fetchConfig()
        if (!config) {
          throw new Error(`No BC config found for vendor "${vendorKey}". Configure it in Settings → BC Export Config.`)
        }

        const rows = selectedLines.map((l) => buildBCRow(config, l))
        totalAmount = selectedLines.reduce(
          (sum, l) => sum + (typeof l.total === 'number' ? l.total : Number(l.total ?? 0)),
          0
        )

        fileName = `${invoiceId}_BC_${formatYMDCompact(new Date())}.xlsx`

        const ws = XLSX.utils.json_to_sheet(rows, {
          header: [
            'Company',
            'Type',
            'No.',
            'Description/Comment',
            'Quantity',
            'Direct Unit Cost Excl. Tax',
            'State',
            'Ops Center',
            'Division',
            'Department',
          ],
        })
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'BC Import')
        XLSX.writeFile(wb, fileName)

        const { data: userData } = await supabase.auth.getUser()
        const exportedBy = userData?.user?.email ?? userData?.user?.id ?? 'unknown'

        const { data: logRow, error: logErr } = await supabase
          .from('bc_export_log')
          .insert({
            vendor_key: vendorKey,
            invoice_id: invoiceId,
            exported_at: new Date().toISOString(),
            exported_by: exportedBy,
            line_item_count: selectedLines.length,
            total_amount: totalAmount,
            export_file_name: fileName,
            status: 'success',
          })
          .select('id')
          .maybeSingle()
        if (logErr) throw logErr

        const batchId = (logRow as { id?: number } | null)?.id ?? null
        const ids = selectedLines.map((l) => l.id).filter(Boolean)
        if (ids.length > 0) {
          const { error: updErr } = await supabase
            .from(activityTable)
            .update({
              bc_exported: true,
              bc_exported_at: new Date().toISOString(),
              bc_export_batch_id: batchId,
            })
            .in('id', ids)
          if (updErr) {
            // Don't fail the whole export — file already downloaded.
            console.warn(`Failed to flag exported rows in ${activityTable}:`, updErr.message)
          }
        }

        toast.success(
          `Exported ${selectedLines.length} line items · $${totalAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} · File: ${fileName}`
        )

        return {
          success: true,
          fileName,
          exportedCount: selectedLines.length,
          totalAmount,
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'BC export failed'
        try {
          await supabase.from('bc_export_log').insert({
            vendor_key: vendorKey,
            invoice_id: invoiceId,
            exported_at: new Date().toISOString(),
            line_item_count: selectedLines.length,
            total_amount: totalAmount,
            export_file_name: fileName || null,
            status: 'error',
            error_message: message,
          })
        } catch {
          /* ignore secondary log errors */
        }
        toast.error(message)
        return {
          success: false,
          exportedCount: 0,
          totalAmount: 0,
          error: message,
        }
      } finally {
        setExporting(false)
      }
    },
    [activityTable, fetchConfig, invoiceId, vendorKey]
  )

  return { exporting, exportLines, fetchConfig }
}
