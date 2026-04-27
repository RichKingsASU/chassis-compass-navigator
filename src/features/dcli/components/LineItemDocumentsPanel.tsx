import { useEffect, useRef, useState, useCallback } from 'react'
import { Download, FileSpreadsheet, FileText, ExternalLink, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { isPdf, isXlsx } from '../format'

const UPLOAD_BUCKET = 'dcli-invoices'
const SIGNED_URL_TTL_SECONDS = 3600

interface LineItemDocumentsPanelProps {
  invoiceNumber: string
  lineItemId: string
}

interface LineDocumentRow {
  id: number | string
  invoice_id: string | null
  line_item_id: string | null
  vendor: string | null
  file_name: string | null
  storage_path: string
  file_type: string | null
  uploaded_at: string | null
  uploaded_by: string | null
  signed_url?: string | null
}

export function LineItemDocumentsPanel({ invoiceNumber, lineItemId }: LineItemDocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<LineDocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('invoice_documents')
        .select('*')
        .eq('invoice_id', invoiceNumber)
        .eq('line_item_id', lineItemId)
        .order('uploaded_at', { ascending: false })
      if (fetchErr) {
        if (/does not exist|schema cache/i.test(fetchErr.message)) {
          setDocuments([])
          return
        }
        throw fetchErr
      }
      const rows = (data ?? []) as LineDocumentRow[]
      const withUrls = await Promise.all(
        rows.map(async (r): Promise<LineDocumentRow> => {
          try {
            const { data: signed } = await supabase.storage
              .from(UPLOAD_BUCKET)
              .createSignedUrl(r.storage_path, SIGNED_URL_TTL_SECONDS)
            return { ...r, signed_url: signed?.signedUrl ?? null }
          } catch {
            return { ...r, signed_url: null }
          }
        })
      )
      setDocuments(withUrls)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [invoiceNumber, lineItemId])

  useEffect(() => {
    load()
  }, [load])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${invoiceNumber}/lines/${lineItemId}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || undefined })
      if (upErr) {
        if (/Bucket not found/i.test(upErr.message)) {
          throw new Error(
            `Bucket "${UPLOAD_BUCKET}" not found. Create it in Supabase Storage first.`
          )
        }
        throw upErr
      }

      const { data: { user } } = await supabase.auth.getUser()
      const { error: insErr } = await supabase.from('invoice_documents').insert({
        invoice_id: invoiceNumber,
        line_item_id: lineItemId,
        vendor: 'dcli',
        file_name: file.name,
        storage_path: path,
        file_type: file.type || null,
        uploaded_by: user?.id ?? user?.email ?? null,
      })
      if (insErr) {
        if (/does not exist|schema cache/i.test(insErr.message)) {
          throw new Error(
            'Table "invoice_documents" does not exist or is missing the line_item_id column. Run the flagged migration in Supabase SQL editor.'
          )
        }
        throw insErr
      }

      toast.success(`Uploaded ${file.name}`)
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Line Item Documents</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive mb-2">{error}</div>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents on file for this line item.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => {
              const pdf = isPdf(doc.file_type, doc.file_name)
              const xlsx = isXlsx(doc.file_type, doc.file_name)
              const Icon = pdf ? FileText : xlsx ? FileSpreadsheet : FileText
              const badgeClass = pdf
                ? 'bg-red-100 text-red-700 border-red-200'
                : xlsx
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground border-border'
              const label = pdf ? 'PDF' : xlsx ? 'XLSX' : (doc.file_type ?? 'File').toUpperCase()
              return (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 p-2 border rounded-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={18} className="text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={doc.file_name ?? ''}>
                        {doc.file_name ?? doc.storage_path}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border mr-2 ${badgeClass}`}
                        >
                          {label}
                        </span>
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {doc.signed_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(doc.signed_url!, '_blank', 'noopener')}
                      >
                        <ExternalLink size={14} /> View
                      </Button>
                    )}
                    {doc.signed_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(doc.signed_url!, '_blank', 'noopener')}
                      >
                        <Download size={14} /> Download
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
