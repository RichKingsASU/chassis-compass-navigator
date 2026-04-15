import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { parseExcelFile, type ParsedSheet } from '@/utils/excelParser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Step = 'upload' | 'review' | 'submit'


export default function FLEXIVANNewInvoice() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedSheet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setError(null)
    setLoading(true)
    try {
      const rows = await parseExcelFile(selected)
      setParsedData(rows)
      setStep('review')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!file || parsedData.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const filePath = `flexivan/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('flexivan-invoices').upload(filePath, file)
      if (uploadError) throw uploadError
      const { error: invError } = await supabase.from('flexivan-invoices').insert({
        source_file: filePath, provider: 'FLEXIVAN', status: 'pending',
        line_count: parsedData.length, created_at: new Date().toISOString(),
      })
      if (invError) throw invError
      setStep('submit')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setUploading(false)
    }
  }

  const firstSheet = parsedData[0]; const columns = firstSheet ? firstSheet.headers.slice(0, 8) : []; const rows = firstSheet ? firstSheet.rows : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/vendors/flexivan')} className="text-muted-foreground hover:text-foreground text-sm">&larr; Back to FLEXIVAN</button>
        <h1 className="text-3xl font-bold">New FLEXIVAN Invoice</h1>
      </div>
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}
      {step === 'upload' && (
        <Card>
          <CardHeader><CardTitle>Upload FLEXIVAN Invoice File</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
              <input type="file" accept=".xlsx,.xls,.pdf" onChange={handleFileChange} className="hidden" id="file-upload" disabled={loading} />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg font-medium">Click to upload</p>
                <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .pdf</p>
              </label>
            </div>
            {loading && <p className="text-center text-muted-foreground mt-4">Parsing file...</p>}
          </CardContent>
        </Card>
      )}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Parsed Data</CardTitle>
              <Badge variant="outline">{rows.length} rows</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{columns.map(col => <TableHead key={col}>{col}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {rows.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>{columns.map(col => <TableCell key={col} className="text-sm">{String((row as any)[col] ?? '')}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleSubmit} disabled={uploading}>{uploading ? 'Submitting...' : 'Submit'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'submit' && (
        <Card>
          <CardHeader><CardTitle>Submitted</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">FLEXIVAN invoice uploaded successfully!</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/vendors/flexivan')}>Back to FLEXIVAN</Button>
              <Button variant="outline" onClick={() => { setStep('upload'); setFile(null); setParsedData([]) }}>Upload Another</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
