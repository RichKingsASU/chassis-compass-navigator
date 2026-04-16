import { supabase } from '@/lib/supabase'
import SimpleInvoiceWizard, { type SaveContext } from '@/components/vendor/SimpleInvoiceWizard'

const VENDOR = 'WCCP'
const PATH = 'wccp'
const BUCKET = 'wccp-invoices'
const HEADER_TABLE = 'wccp_invoice'
const DATA_TABLE = 'wccp_invoice_data'

async function insertHeader(ctx: SaveContext): Promise<string> {
  const primary = ctx.uploaded[0]
  const { data, error } = await supabase
    .from(HEADER_TABLE)
    .insert({
      invoice_number: ctx.header.invoice_number,
      invoice_date: ctx.header.invoice_date,
      provider: VENDOR,
      total_amount_usd: parseFloat(ctx.header.total_amount) || 0,
      status: 'pending',
      file_path: primary.path,
      file_name: primary.entry.file.name,
      file_type: primary.ext,
      notes: ctx.header.notes || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`Invoice insert failed: ${error.message}`)
  return data.id as string
}

async function insertLineItems(invoiceId: string, ctx: SaveContext): Promise<void> {
  const rows = ctx.files
    .filter(f => !f.isPdf && f.rows.length > 0)
    .flatMap(f => f.rows.map(row => ({
      invoice_id: invoiceId,
      sheet_name: f.file.name,
      row_data: row,
    })))
  if (!rows.length) return
  const { error } = await supabase.from(DATA_TABLE).insert(rows)
  if (error) throw new Error(`Line items insert failed: ${error.message}`)
}

export default function WCCPNewInvoice() {
  return (
    <SimpleInvoiceWizard
      vendorName={VENDOR}
      vendorPath={PATH}
      storageBucket={BUCKET}
      invoiceTable={HEADER_TABLE}
      insertHeader={insertHeader}
      insertLineItems={insertLineItems}
    />
  )
}
