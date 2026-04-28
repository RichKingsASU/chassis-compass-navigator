import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type InvoiceDocument, formatBytes } from '@/types/invoice'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileText, FileSpreadsheet, FileCode, Clock, User, HardDrive, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function DCLIDocuments() {
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['dcli_invoice_documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_invoice_documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as InvoiceDocument[]
    }
  })

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t === 'pdf') return <FileText size={18} className="text-red-500" />
    if (t === 'xlsx' || t === 'xls' || t === 'csv') return <FileSpreadsheet size={18} className="text-emerald-600" />
    return <FileCode size={18} className="text-muted-foreground" />
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Repository</h1>
          <p className="text-muted-foreground mt-1">Unified storage for all DCLI invoice summaries and supporting data</p>
        </div>
        <Badge variant="outline" className="h-8 px-4 font-bold uppercase tracking-widest text-[10px] bg-muted/50">
          {documents.length} Assets
        </Badge>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Failed to synchronize document store'}</p>
        </div>
      )}

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Audit Attachments</CardTitle>
            <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-1"><HardDrive size={10} /> Cloud Storage Ready</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <TableHead className="px-6 py-4">Artifact Name</TableHead>
                <TableHead className="px-6 py-4">Format</TableHead>
                <TableHead className="px-6 py-4">Dimensions</TableHead>
                <TableHead className="px-6 py-4">Context Role</TableHead>
                <TableHead className="px-6 py-4"><div className="flex items-center gap-1"><User size={10} /> Originator</div></TableHead>
                <TableHead className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-1"><Clock size={10} /> Timestamp</div></TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-muted rounded-full opacity-50"><FileText size={32} /></div>
                      <p className="text-sm font-medium">The document repository is currently empty.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors border-b last:border-0 group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.file_type)}
                        <span className="font-bold text-sm tracking-tight truncate max-w-[200px]">{doc.original_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-tighter py-0.5">
                        {doc.file_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-mono font-medium text-muted-foreground">
                      {formatBytes(doc.file_size_bytes)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
                        {doc.document_role.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[11px] font-semibold text-muted-foreground">
                      {doc.uploaded_by_email?.split('@')[0] ?? 'SYSTEM'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">
                      {format(new Date(doc.created_at), 'MMM d, yyyy · HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
