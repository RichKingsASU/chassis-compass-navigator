import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'
import { GpsSyncPanel } from '@/components/gps/GpsSyncPanel'

interface BbrRecord {
  id: number
  chassis_number: string
  geofence: string | null
  address: string | null
  movement: string | null
  movement_last_update: string | null
  idle_for: string | null
  battery: string | null
  container: string | null
  leasing: string | null
  _source_file: string | null
  _load_ts: string
}

// ── API Data Tab ───────────────────────────────────────────────────────────────
// Shows data loaded via the BlackBerry API (blackberry_{tran|log}_gps tables)

interface ApiRecord {
  id: number
  chassis_number: string | null
  event_type: string | null
  recorded_on: string | null
  geofence_name: string | null
  lat: number | null
  lon: number | null
  velocity: number | null
  battery_state: boolean | null
  container_mounted: boolean | null
  event_subtype: string | null
  is_repair_chassis: boolean | null
}

function ApiDataTable({ tableName }: { tableName: string }) {
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [repairOnly, setRepairOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from(tableName)
      .select('id,chassis_number,event_type,recorded_on,geofence_name,lat,lon,velocity,battery_state,container_mounted,event_subtype,is_repair_chassis')
      .order('recorded_on', { ascending: false })
      .limit(500)

    if (repairOnly) query = query.eq('is_repair_chassis', true)

    query.then(({ data }) => {
      setRecords(data || [])
      setLoading(false)
    })
  }, [tableName, repairOnly])

  const repairCount = records.filter(r => r.is_repair_chassis).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="repair-only"
            checked={repairOnly}
            onChange={e => setRepairOnly(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="repair-only" className="text-sm font-medium">
            Repair chassis only
          </label>
        </div>
        <Badge variant="outline">{repairCount} repair chassis records</Badge>
        <Badge variant="secondary">{records.length} total shown</Badge>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chassis #</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Recorded On</TableHead>
              <TableHead>Geofence</TableHead>
              <TableHead>Lat / Lon</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Container</TableHead>
              <TableHead>Repair</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No API data loaded yet — run the sync script to pull data.
                </TableCell>
              </TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={r.is_repair_chassis ? 'bg-amber-50' : ''}>
                <TableCell className="font-mono text-sm">{r.chassis_number || '—'}</TableCell>
                <TableCell>
                  <Badge variant={r.event_type === 'asset.event' ? 'default' : 'secondary'} className="text-xs">
                    {r.event_type === 'asset.event' ? 'Geofence Event' : 'Sensor Ping'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {r.recorded_on ? new Date(r.recorded_on).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-sm">{r.geofence_name || '—'}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {r.lat && r.lon ? `${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}` : '—'}
                </TableCell>
                <TableCell className="text-sm">{r.velocity != null ? `${r.velocity} mph` : '—'}</TableCell>
                <TableCell className="text-sm">
                  {r.container_mounted == null ? '—' : r.container_mounted ? 'Yes' : 'No'}
                </TableCell>
                <TableCell>
                  {r.is_repair_chassis && (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      ⚠ Repair
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

// ── Upload (CSV snapshot) Tab ──────────────────────────────────────────────────

function BbrTable({ records, loading }: { records: BbrRecord[]; loading: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Chassis #</TableHead>
          <TableHead>Geofence</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Movement</TableHead>
          <TableHead>Idle For</TableHead>
          <TableHead>Battery</TableHead>
          <TableHead>Container</TableHead>
          <TableHead>Leasing</TableHead>
          <TableHead>Source File</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              No data uploaded yet.
            </TableCell>
          </TableRow>
        ) : records.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
            <TableCell className="text-sm">{r.geofence || '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{r.address || '—'}</TableCell>
            <TableCell><Badge variant="outline">{r.movement || '—'}</Badge></TableCell>
            <TableCell className="text-sm">{r.idle_for || '—'}</TableCell>
            <TableCell className="text-sm">{r.battery || '—'}</TableCell>
            <TableCell className="text-sm">{r.container || '—'}</TableCell>
            <TableCell className="text-sm">{r.leasing || '—'}</TableCell>
            <TableCell className="text-xs font-mono text-muted-foreground">{r._source_file || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SystemPanel({ tableName, bucket, fileName }: {
  tableName: string; bucket: string; fileName: string
}) {
  const [records, setRecords] = useState<BbrRecord[]>([])
  const [loading, setLoading] = useState(true)

  function loadRecords() {
    setLoading(true)
    supabase.from(tableName).select('*').order('_load_ts', { ascending: false }).limit(500)
      .then(({ data }) => { setRecords(data || []); setLoading(false) })
  }

  useEffect(() => { loadRecords() }, [tableName])

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  return (
    <div className="space-y-6">
      <GpsUploadZone
        requiredFileName={fileName}
        bucket={bucket}
        table={tableName}
        accept=".csv"
        uploadDates={uploadDates}
        onExtracted={() => loadRecords()}
      />
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Unique Chassis</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{uniqueChassis}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Days Uploaded</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{uploadDates.length}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Records</CardTitle></CardHeader>
        <CardContent><BbrTable records={records} loading={loading} /></CardContent>
      </Card>
    </div>
  )
}

function CombinedPanel() {
  const [records, setRecords] = useState<(BbrRecord & { bbr_system: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('v_blackberry_gps').select('*').order('_load_ts', { ascending: false }).limit(1000)
      .then(({ data }) => { setRecords(data || []); setLoading(false) })
  }, [])

  return (
    <Card>
      <CardHeader><CardTitle>Combined Blackberry View</CardTitle></CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Chassis #</TableHead>
                <TableHead>Geofence</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Idle For</TableHead>
                <TableHead>Source File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No data uploaded yet.
                  </TableCell>
                </TableRow>
              ) : records.map(r => (
                <TableRow key={`${r.bbr_system}-${r.id}`}>
                  <TableCell>
                    <Badge variant={r.bbr_system === 'log' ? 'default' : 'secondary'}>
                      {r.bbr_system}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.chassis_number}</TableCell>
                  <TableCell className="text-sm">{r.geofence || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.address || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{r.movement || '—'}</Badge></TableCell>
                  <TableCell className="text-sm">{r.idle_for || '—'}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r._source_file || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BlackBerryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">BlackBerry Radar GPS</h1>
        <p className="text-muted-foreground">
          Two separate systems — Log and Tran — stored independently, combined view available
        </p>
      </div>

      {/* Sync status panel */}
      <GpsSyncPanel />

      <Tabs defaultValue="api-tran">
        <TabsList>
          <TabsTrigger value="api-tran">API Data — Tran</TabsTrigger>
          <TabsTrigger value="api-log">API Data — Log</TabsTrigger>
          <TabsTrigger value="upload-log">CSV Upload — Log</TabsTrigger>
          <TabsTrigger value="upload-tran">CSV Upload — Tran</TabsTrigger>
          <TabsTrigger value="combined">Combined</TabsTrigger>
        </TabsList>

        <TabsContent value="api-tran">
          <Card>
            <CardHeader>
              <CardTitle>Tran — API Stream Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiDataTable tableName="blackberry_tran_gps" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-log">
          <Card>
            <CardHeader>
              <CardTitle>Log — API Stream Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiDataTable tableName="blackberry_log_gps" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload-log">
          <SystemPanel
            tableName="blackberry_log_gps"
            bucket="gps-blackberry-log"
            fileName="BlackBerry-Radar-Fleet-State-Log.csv"
          />
        </TabsContent>

        <TabsContent value="upload-tran">
          <SystemPanel
            tableName="blackberry_tran_gps"
            bucket="gps-blackberry-tran"
            fileName="BlackBerry-Radar-Fleet-State-Tran.csv"
          />
        </TabsContent>

        <TabsContent value="combined">
          <CombinedPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
