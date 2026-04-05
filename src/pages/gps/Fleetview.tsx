import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import DataFreshnessBar from '@/components/DataFreshnessBar'

interface GpsRecord {
  id: string
  chassis_number: string
  latitude: number
  longitude: number
  timestamp: string
  speed: number
  status: string
  location_name: string
}

interface UploadedFile {
  id: string
  file_name: string
  record_count: number
  created_at: string
  status: string
}

const PROVIDER_NAME = 'Fleetview'
const BUCKET_NAME = 'gps-fleetview'

export default function FleetviewPage() {
  const [records, setRecords] = useState<GpsRecord[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [recRes, fileRes] = await Promise.all([
          supabase.from('gps_data').select('*').eq('provider', PROVIDER_NAME).order('timestamp', { ascending: false }).limit(100),
          supabase.from('gps_uploads').select('*').eq('provider', PROVIDER_NAME).order('created_at', { ascending: false }),
        ])
        setRecords(recRes.data || [])
        setFiles(fileRes.data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
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
    setUploadSuccess(false)
    try {
      const filePath = `${PROVIDER_NAME.toLowerCase()}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('gps_uploads').insert({
        provider: PROVIDER_NAME, file_name: file.name, file_path: filePath,
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

  const totalChassis = new Set(records.map(r => r.chassis_number)).size

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{PROVIDER_NAME} GPS</h1>
        <p className="text-muted-foreground">{PROVIDER_NAME} GPS tracking data and management</p>
      </div>

      <DataFreshnessBar tableName="fleetview_gps" label="Fleetview GPS" />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/30">
          Query error — data could not be loaded. Check console for details.
        </div>
      )}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{totalChassis}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Files Uploaded</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{files.length}</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Fleet Map</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center border">
                <p className="text-muted-foreground text-lg font-medium">Fleet Map — Connect Google Maps API</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Positions</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p> : records.length === 0 ? <p className="text-muted-foreground">No GPS data.</p> : (
                <ul className="space-y-2">
                  {records.slice(0, 5).map(r => (
                    <li key={r.id} className="flex justify-between text-sm border-b pb-2">
                      <span className="font-mono">{r.chassis_number}</span>
                      <span className="text-muted-foreground">{r.location_name || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`}</span>
                      <span className="text-muted-foreground">{formatDate(r.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>GPS Data Records</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data uploaded yet.</TableCell></TableRow>
                    ) : records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.chassis_number}</TableCell>
                        <TableCell>{formatDate(r.timestamp)}</TableCell>
                        <TableCell className="text-sm">{r.location_name || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`}</TableCell>
                        <TableCell>{r.speed ? `${r.speed} mph` : 'N/A'}</TableCell>
                        <TableCell><Badge variant="outline">{r.status || 'N/A'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Upload GPS Data</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Upload {PROVIDER_NAME} GPS data files (.csv, .xlsx) to the {BUCKET_NAME} bucket.</p>
              {uploadSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">File uploaded successfully!</div>}
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" id="gps-upload" disabled={uploading} />
                <label htmlFor="gps-upload" className="cursor-pointer block">
                  <div className="text-4xl mb-4">📡</div>
                  <p className="text-lg font-medium">Click to upload GPS data</p>
                  <p className="text-sm text-muted-foreground">Supports .csv, .xlsx, .xls</p>
                </label>
              </div>
              {uploading && <p className="text-center text-muted-foreground">Uploading...</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Uploaded Documents</CardTitle></CardHeader>
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
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No files uploaded.</TableCell></TableRow>
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
