import { useMemo, useRef, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  Search,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useDcliDocuments } from '../hooks/useDcliDocuments'
import type { DcliDocumentWithUrl } from '../types'
import { formatBytes, isPdf, isXlsx } from '../format'

const UPLOAD_BUCKET = 'dcli-invoices'

interface InvoiceGroup {
  invoiceNumber: string
  pdf: DcliDocumentWithUrl | null
  xlsx: DcliDocumentWithUrl | null
  others: DcliDocumentWithUrl[]
  latestCreatedAt: string
}

type BadgeKind = 'pdf' | 'xlsx' | 'jpg' | 'png' | 'email' | 'txt' | 'zip' | 'file'

function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function getBadgeKind(fileType: string | null | undefined, name: string | null | undefined): BadgeKind {
  if (isPdf(fileType, name)) return 'pdf'
  if (isXlsx(fileType, name)) return 'xlsx'
  const t = (fileType ?? '').toLowerCase()
  const n = (name ?? '').toLowerCase()
  if (t === 'image/jpeg' || t === 'image/jpg' || n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'jpg'
  if (t === 'image/png' || n.endsWith('.png')) return 'png'
  if (t === 'message/rfc822' || n.endsWith('.eml')) return 'email'
  if (t === 'text/plain' || n.endsWith('.txt')) return 'txt'
  if (t === 'application/zip' || n.endsWith('.zip')) return 'zip'
  return 'file'
}

const BADGE_STYLES: Record<BadgeKind, { className: string; label: string }> = {
  pdf:   { className: 'bg-red-100 text-red-700 border-red-200',           label: 'PDF' },
  xlsx:  { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'XLSX' },
  jpg:   { className: 'bg-blue-100 text-blue-700 border-blue-200',         label: 'JPG' },
  png:   { className: 'bg-blue-100 text-blue-700 border-blue-200',         label: 'PNG' },
  email: { className: 'bg-purple-100 text-purple-700 border-purple-200',   label: 'EMAIL' },
  txt:   { className: 'bg-muted text-muted-foreground border-border',      label: 'TXT' },
  zip:   { className: 'bg-muted text-muted-foreground border-border',      label: 'ZIP' },
  file:  { className: 'bg-muted text-muted-foreground border-border',      label: 'FILE' },
}

function iconForKind(kind: BadgeKind) {
  switch (kind) {
    case 'pdf': return FileText
    case 'xlsx': return FileSpreadsheet
    case 'jpg':
    case 'png': return ImageIcon
    case 'email': return Mail
    default: return FileText
  }
}

function DocumentEntry({ doc }: { doc: DcliDocumentWithUrl }) {
  const kind = getBadgeKind(doc.file_type, doc.original_name)
  const { className: badgeClass, label } = BADGE_STYLES[kind]
  const Icon = iconForKind(kind)
  const open = () => {
    if (doc.signed_url) window.open(doc.signed_url, '_blank', 'noopener')
  }
  return (
    <div className="flex items-center justify-between gap-2 p-2 border rounded-md">
      <div className="flex items-center gap-2 min-w-0">
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
            {formatBytes(doc.file_size_bytes)} · {formatDateShort(doc.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {kind === 'pdf' && (
          <Button size="sm" variant="outline" className="gap-1" onClick={open} disabled={!doc.signed_url}>
            <ExternalLink size={14} /> View
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1" onClick={open} disabled={!doc.signed_url}>
          <Download size={14} /> Download
        </Button>
      </div>
    </div>
  )
}

interface InvoiceCardProps {
  group: InvoiceGroup
  onUploaded: () => void
}

function InvoiceCard({ group, onUploaded }: InvoiceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${group.invoiceNumber}/${safeName}`
      const { error: upErr } = await supabase.storage
        .from(UPLOAD_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || undefined })
      if (upErr) {
        if (/Bucket not found/i.test(upErr.message)) {
          throw new Error(`Bucket "${UPLOAD_BUCKET}" not found. Create it in Supabase Storage first.`)
        }
        throw upErr
      }

      const { data: { user } } = await supabase.auth.getUser()
      const { error: insErr } = await supabase.from('invoice_documents').insert({
        invoice_id: group.invoiceNumber,
        vendor: 'dcli',
        file_name: file.name,
        storage_path: path,
        file_type: file.type || null,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user?.email ?? user?.id ?? null,
      })
      if (insErr) {
        if (/does not exist|schema cache/i.test(insErr.message)) {
          throw new Error(
            'Table "invoice_documents" does not exist. Run the flagged migration in Supabase SQL editor.'
          )
        }
        throw insErr
      }

      toast.success(`Uploaded ${file.name} to invoice ${group.invoiceNumber}`)
      onUploaded()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-mono truncate">{group.invoiceNumber}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last upload {formatDateShort(group.latestCreatedAt)}
            </p>
          </div>
          <div className="flex-shrink-0">
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
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {group.pdf && <DocumentEntry doc={group.pdf} />}
        {group.xlsx && <DocumentEntry doc={group.xlsx} />}
        {group.others.map((doc) => (
          <DocumentEntry key={doc.id} doc={doc} />
        ))}
        {!group.pdf && !group.xlsx && group.others.length === 0 && (
          <p className="text-sm text-muted-foreground">No files attached.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function DcliDocumentsTab() {
  const { documents, loading, error, refresh } = useDcliDocuments()
  const [search, setSearch] = useState('')

  const groups = useMemo<InvoiceGroup[]>(() => {
    const map = new Map<string, InvoiceGroup>()
    for (const doc of documents) {
      const key = doc.invoice_number ?? doc.invoice_id ?? doc.id
      let g = map.get(key)
      if (!g) {
        g = { invoiceNumber: key, pdf: null, xlsx: null, others: [], latestCreatedAt: doc.created_at }
        map.set(key, g)
      }
      const isP = isPdf(doc.file_type, doc.original_name)
      const isX = isXlsx(doc.file_type, doc.original_name)
      if (isP && !g.pdf) g.pdf = doc
      else if (isX && !g.xlsx) g.xlsx = doc
      else g.others.push(doc)
      if (doc.created_at > g.latestCreatedAt) g.latestCreatedAt = doc.created_at
    }
    return Array.from(map.values()).sort((a, b) => b.latestCreatedAt.localeCompare(a.latestCreatedAt))
  }, [documents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.invoiceNumber.toLowerCase().includes(q))
  }, [groups, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">DCLI Documents</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${groups.length} invoice${groups.length === 1 ? '' : 's'} · ${documents.length} file${documents.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border rounded-md text-sm bg-background"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-lg font-medium">No documents found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Try a different search term.' : 'Documents will appear here once invoices are uploaded.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <InvoiceCard key={group.invoiceNumber} group={group} onUploaded={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
