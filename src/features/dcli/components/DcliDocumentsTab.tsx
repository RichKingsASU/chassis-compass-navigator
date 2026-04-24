import { useMemo, useState } from 'react'
import { Download, ExternalLink, FileSpreadsheet, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDcliDocuments } from '../hooks/useDcliDocuments'
import type { DcliDocumentWithUrl } from '../types'
import { formatBytes, isPdf, isXlsx } from '../format'

interface InvoiceGroup {
  invoiceNumber: string
  pdf: DcliDocumentWithUrl | null
  xlsx: DcliDocumentWithUrl | null
  others: DcliDocumentWithUrl[]
  latestCreatedAt: string
}

function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function DocumentEntry({ doc, kind }: { doc: DcliDocumentWithUrl; kind: 'pdf' | 'xlsx' | 'other' }) {
  const Icon = kind === 'pdf' ? FileText : kind === 'xlsx' ? FileSpreadsheet : FileText
  const badgeClass =
    kind === 'pdf'
      ? 'bg-red-100 text-red-700 border-red-200'
      : kind === 'xlsx'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-muted text-muted-foreground border-border'
  const label = kind === 'pdf' ? 'PDF' : kind === 'xlsx' ? 'XLSX' : (doc.file_type ?? 'File').toUpperCase()
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

export function DcliDocumentsTab() {
  const { documents, loading, error } = useDcliDocuments()
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
            <Card key={group.invoiceNumber} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-mono">{group.invoiceNumber}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Last upload {formatDateShort(group.latestCreatedAt)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.pdf && <DocumentEntry doc={group.pdf} kind="pdf" />}
                {group.xlsx && <DocumentEntry doc={group.xlsx} kind="xlsx" />}
                {group.others.map((doc) => (
                  <DocumentEntry key={doc.id} doc={doc} kind="other" />
                ))}
                {!group.pdf && !group.xlsx && group.others.length === 0 && (
                  <p className="text-sm text-muted-foreground">No files attached.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
