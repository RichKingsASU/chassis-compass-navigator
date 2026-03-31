import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type InvoiceDocument, formatBytes } from '@/types/invoice'

export default function DCLIDocuments() {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_invoice_documents')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
        if (fetchErr) throw fetchErr
        setDocuments(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load documents')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI Documents</h1>
        <p className="text-muted-foreground">All uploaded invoice documents</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {loading ? (
        <p className="text-muted-foreground">Loading documents...</p>
      ) : (
        <Card>
          <CardHeader><CardTitle>Documents ({documents.length})</CardTitle></CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No documents uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.original_name}</TableCell>
                      <TableCell>{doc.file_type}</TableCell>
                      <TableCell>{formatBytes(doc.file_size_bytes)}</TableCell>
                      <TableCell>{doc.document_role}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.uploaded_by_email ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
