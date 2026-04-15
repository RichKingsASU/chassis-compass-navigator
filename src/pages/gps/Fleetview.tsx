import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'

interface AssetRecord {
  id: number
  chassis_number: string
  device_serial_number: string | null
  days_dormant: number | null
  event_reason: string | null
  report_time: string | null
  gps_time: string | null
  landmark: string | null
  address: string | null
  nearest_major_city: string | null
  _source_file: string | null
  _load_ts: string
}

export default function FleetviewPage() {
  const [records, setRecords] = useState<AssetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadRecords() {
    setLoading(true)
    supabase.from('assetlist_gps').select('*').order('_load_ts', { ascending: false }).limit(500)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRecords(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { loadRecords() }, [])

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const dormantOver3 = records.filter(r => (r.days_dormant ?? 0) >= 3).length
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fleetview GPS</h1>
        <p className="text-muted-foreground">Milestone / Fleetview asset tracking</p>
      </div>
      {error && <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">{error}</div>}
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{uniqueChassis}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Days Uploaded</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{uploadDates.length}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dormant 3+ Days</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-amber-600">{dormantOver3}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Recent Records</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
                records.length === 0 ? <p className="text-sm text-muted-foreground">No data uploaded yet.</p> : (
                  <ul className="space-y-2">
                    {records.slice(0, 8).map(r => (
                      <li key={r.id} className="flex justify-between text-sm border-b pb-2">
                        <span className="font-mono font-medium">{r.chassis_number}</span>
                        <span className="text-muted-foreground">{r.landmark || r.nearest_major_city || '—'}</span>
                        <span className={`font-medium ${(r.days_dormant ?? 0) >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.days_dormant != null ? `${r.days_dormant}d` : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="data">
          <Card>
            <CardHeader><CardTitle>Asset Records</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Landmark</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Nearest City</TableHead>
                      <TableHead>Days Dormant</TableHead>
                      <TableHead>Report Time</TableHead>
                      <TableHead>GPS Time</TableHead>
                      <TableHead>Source File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No data uploaded yet.</TableCell></TableRow>
                    ) : records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                        <TableCell className="text-sm">{r.landmark || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.address || '—'}</TableCell>
                        <TableCell className="text-sm">{r.nearest_major_city || '—'}</TableCell>
                        <TableCell>
                          {r.days_dormant != null ? (
                            <Badge variant={r.days_dormant >= 3 ? 'destructive' : 'outline'}>{r.days_dormant}d</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.report_time ? new Date(r.report_time).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.gps_time ? new Date(r.gps_time).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{r._source_file || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload">
          <GpsUploadZone
            requiredFileName="AssetList.xlsx"
            bucket="gps-fleetview"
            table="assetlist_gps"
            accept=".xlsx,.xls"
            uploadDates={uploadDates}
            onExtracted={() => loadRecords()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
