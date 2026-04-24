import { Download, FileSpreadsheet, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDcliDocuments } from '../hooks/useDcliDocuments'
import { formatBytes, isPdf, isXlsx } from '../format'

interface DocumentsPanelProps {
  invoiceNumber: string | null | undefined
  title?: string
  emptyMessage?: string
}

export function DocumentsPanel({
  invoiceNumber,
  title = 'Documents',
  emptyMessage = 'No documents on file for this invoice.',
}: DocumentsPanelProps) {
  const { documents, loading, error } = useDcliDocuments(invoiceNumber)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
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
