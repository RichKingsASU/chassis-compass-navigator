import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface YardRecord {
  id: string
  chassis_number: string
  container_number: string
  location: string
  status: string
  entry_date: string
  exit_date: string
  provider: string
  report_date: string
}

interface UploadedFile {
  id: string
  file_name: string
  record_count: number
  created_at: string
  status: string
}

export default function POLAYard() {
  const [records, setRecords] = useState<YardRecord[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [recRes, fileRes] = await Promise.all([
          supabase.from('yard_pola').select('*').order('report_date', { ascending: false }).limit(200),
          supabase.from('yard_uploads').select('*').eq('yard', 'POLA').order('created_at', { ascending: false }),
        ])
        setRecords(recRes.data || [])
        setFiles(fileRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const filePath = `pola/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('yard-pola').upload(filePath, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('yard_uploads').insert({
        yard: 'POLA', file_name: file.name, file_path: filePath,
        status: 'pending', created_at: new Date().toISOString(),
      })
      if (dbError) throw dbError
      setUploadSuccess(true)
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filtered = search
    ? records.filter(r => r.chassis_number?.includes(search.toUpperCase()) || r.container_number?.includes(search.toUpperCase()))
    : records

  const inYard = records.filter(r => r.status?.toLowerCase() === 'in').length
  const outYard = records.filter(r => r.status?.toLowerCase() === 'out').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">POLA / PIER S Yard</h1>
        <p className="text-muted-foreground">Port of Los Angeles — Pier S Terminal chassis inventory</p>
      </div>

      <DataFreshnessBar tableName="yard_events_data" label="Terminal Events" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. Check console for details.
        </div>
      )}

      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Yard Data</TabsTrigger>
          <TabsTrigger value="upload">Upload Report</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Chassis</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Yard</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-green-600">{inYard}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Out of Yard</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-blue-600">{outYard}</p></CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search chassis or container..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <Card>
            <CardContent className="pt-4">
              {loading ? <p className="text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Container #</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : filtered.slice(0, 50).map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                        <TableCell className="font-mono text-sm">{r.container_number || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{r.location || 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{r.provider || 'N/A'}</Badge></TableCell>
                        <TableCell>{formatDate(r.entry_date)}</TableCell>
                        <TableCell><Badge variant={r.status?.toLowerCase() === 'in' ? 'default' : 'secondary'}>{r.status || 'N/A'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filtered.length > 50 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 50 of {filtered.length} records</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Upload Yard Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Upload a yard report file (.csv, .xlsx) for POLA / Pier S.</p>
              {uploadSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">Report uploaded successfully!</div>}
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" id="yard-upload" disabled={uploading} />
                <label htmlFor="yard-upload" className="cursor-pointer block">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg font-medium">Click to upload yard report</p>
                  <p className="text-sm text-muted-foreground">Supports .csv, .xlsx, .xls</p>
                </label>
              </div>
              {uploading && <p className="text-center text-muted-foreground">Uploading...</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Uploaded Reports</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No reports uploaded.</TableCell></TableRow>
                  ) : files.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-sm">{f.file_name}</TableCell>
                      <TableCell>{formatDate(f.created_at)}</TableCell>
                      <TableCell>{f.record_count ?? 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{f.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
