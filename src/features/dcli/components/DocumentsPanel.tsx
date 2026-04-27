import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileText, ExternalLink, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useDcliDocuments } from '../hooks/useDcliDocuments'
import { formatBytes, isPdf, isXlsx } from '../format'

interface DocumentsPanelProps {
  invoiceNumber: string | null | undefined
  title?: string
  emptyMessage?: string
}

const UPLOAD_BUCKET = 'dcli-invoices'

export function DocumentsPanel({
  invoiceNumber,
  title = 'Documents',
  emptyMessage = 'No documents on file for this invoice.',
}: DocumentsPanelProps) {
  const { documents, loading, error, refresh } = useDcliDocuments(invoiceNumber)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !invoiceNumber) return
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${invoiceNumber}/${Date.now()}_${safeName}`
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
        vendor: 'dcli',
        file_name: file.name,
        storage_path: path,
        file_type: file.type || null,
        uploaded_by: user?.id ?? user?.email ?? null,
      })
      if (insErr) {
        if (/does not exist|schema cache/i.test(insErr.message)) {
          throw new Error(
            'Table "invoice_documents" does not exist. Run the flagged migration in Supabase SQL editor.'
          )
        }
        throw insErr
      }

      toast.success(`Uploaded ${file.name}`)
      refresh()
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
          <CardTitle className="text-base">{title}</CardTitle>
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
              disabled={uploading || !invoiceNumber}
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
        {error && (
          <div className="text-sm text-destructive mb-2">{error}</div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => {
              const pdf = isPdf(doc.file_type, doc.original_name)
              const xlsx = isXlsx(doc.file_type, doc.original_name)
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
                      <p className="text-sm font-medium truncate" title={doc.original_name ?? ''}>
                        {doc.original_name ?? doc.storage_path}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border mr-2 ${badgeClass}`}
                        >
                          {label}
                        </span>
                        {formatBytes(doc.file_size_bytes)} ·{' '}
                        {new Date(doc.created_at).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {pdf && doc.signed_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (doc.signed_url) window.open(doc.signed_url, '_blank', 'noopener')
                        }}
                      >
                        <ExternalLink size={14} /> View
                      </Button>
                    )}
                    {doc.signed_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (doc.signed_url) window.open(doc.signed_url, '_blank', 'noopener')
                        }}
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
