import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'

interface SamsaraRecord {
  id: number
  chassis_number: string
  tag_name: string | null
  landmark: string | null
  address: string | null
  device_last_connected: string | null
  dormant_days: number | null
  _source_file: string | null
  _load_ts: string
}

export default function SamsaraPage() {
  const [records, setRecords] = useState<SamsaraRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadRecords() {
    setLoading(true)
    supabase.from('samsara_gps').select('*').order('_load_ts', { ascending: false }).limit(500)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRecords(data || [])
        setLoading(false)
      })
  }

  useEffect(() => { loadRecords() }, [])

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const dormantOver3 = records.filter(r => (r.dormant_days ?? 0) >= 3).length
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Samsara GPS</h1>
        <p className="text-muted-foreground">Samsara Fleet Telematics — Real-time tracking and data management</p>
      </div>
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardHeader><CardTitle>Most Recent Upload</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground text-sm">Loading...</p> :
                records.length === 0 ? <p className="text-muted-foreground text-sm">No data uploaded yet.</p> : (
                  <ul className="space-y-2">
                    {records.slice(0, 8).map(r => (
                      <li key={r.id} className="flex justify-between text-sm border-b pb-2">
                        <span className="font-mono font-medium">{r.chassis_number}</span>
                        <span className="text-muted-foreground truncate max-w-xs">{r.landmark || '—'}</span>
                        <span className={`font-medium ${(r.dormant_days ?? 0) >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.dormant_days != null ? `${r.dormant_days}d dormant` : '—'}
                        </span>
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
              {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Tag / Fleet</TableHead>
                      <TableHead>Landmark</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Dormant Days</TableHead>
                      <TableHead>Device Last Connected</TableHead>
                      <TableHead>Source File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No data uploaded yet.</TableCell></TableRow>
                    ) : records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                        <TableCell className="text-sm">{r.tag_name || '—'}</TableCell>
                        <TableCell className="text-sm">{r.landmark || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.address || '—'}</TableCell>
                        <TableCell>
                          {r.dormant_days != null ? (
                            <Badge variant={r.dormant_days >= 3 ? 'destructive' : 'outline'}>{r.dormant_days}d</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.device_last_connected || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{r._source_file || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload" className="space-y-4">
          <GpsUploadZone
            requiredFileName="KF Chassis Report.xlsx"
            bucket="gps-samsara"
            table="samsara_gps"
            accept=".xlsx,.xls"
            uploadDates={uploadDates}
            onExtracted={() => loadRecords()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
