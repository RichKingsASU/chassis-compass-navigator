import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'

interface FleetlocateRecord {
  id: number
  chassis_number: string
  group_name: string | null
  status: string | null
  duration: string | null
  dormant_days: number | null
  landmark: string | null
  address: string | null
  city: string | null
  state: string | null
  last_event_date: string | null
  battery_status: string | null
  _source_file: string | null
  _load_ts: string
}

export default function FleetlocatePage() {
  const [records, setRecords] = useState<FleetlocateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadRecords() {
    setLoading(true)
    supabase.from('fleetlocate_gps').select('*').order('_load_ts', { ascending: false }).limit(500)
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
        <h1 className="text-3xl font-bold">FleetLocate GPS</h1>
        <p className="text-muted-foreground">Spireon / Solera FleetLocate — TRAC chassis tracking</p>
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
                        <span className="text-muted-foreground">{r.landmark || [r.city, r.state].filter(Boolean).join(', ') || '—'}</span>
                        <span className={`font-medium ${(r.dormant_days ?? 0) >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.duration || '—'}
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
            <CardHeader><CardTitle>FleetLocate Records</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis #</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Landmark</TableHead>
                      <TableHead>City / State</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Battery</TableHead>
                      <TableHead>Last Event</TableHead>
                      <TableHead>Source File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No data uploaded yet.</TableCell></TableRow>
                    ) : records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                        <TableCell className="text-sm">{r.group_name || '—'}</TableCell>
                        <TableCell className="text-sm">{r.landmark || '—'}</TableCell>
                        <TableCell className="text-sm">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</TableCell>
                        <TableCell>
                          {r.dormant_days != null ? (
                            <Badge variant={r.dormant_days >= 3 ? 'destructive' : 'outline'}>{r.duration}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.status || '—'}</Badge></TableCell>
                        <TableCell className="text-sm">{r.battery_status || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.last_event_date ? new Date(r.last_event_date).toLocaleDateString() : '—'}
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
            requiredFileName="FleetLocate.csv"
            bucket="gps-fleetlocate"
            table="fleetlocate_gps"
            accept=".csv"
            uploadDates={uploadDates}
            onExtracted={() => loadRecords()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
