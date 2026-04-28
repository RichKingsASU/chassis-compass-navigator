import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'
import { GpsSyncPanel } from '@/components/gps/GpsSyncPanel'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Radio, 
  Database, 
  Activity, 
  MapPin, 
  Battery, 
  Container, 
  ShieldAlert, 
  History,
  FileSpreadsheet,
  Zap,
  BarChart3,
  Cpu
} from 'lucide-react'

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
  const [repairOnly, setRepairOnly] = useState(false)

  const { data: records = [], isLoading: loading } = useQuery({
    queryKey: [tableName, 'api', repairOnly],
    queryFn: async () => {
      let query = supabase
        .from(tableName)
        .select('id,chassis_number,event_type,recorded_on,geofence_name,lat,lon,velocity,battery_state,container_mounted,event_subtype,is_repair_chassis')
        .order('recorded_on', { ascending: false })
        .limit(500)

      if (repairOnly) query = query.eq('is_repair_chassis', true)
      
      const { data, error } = await query
      if (error) throw error
      return (data || []) as ApiRecord[]
    }
  })

  const repairCount = records.filter(r => r.is_repair_chassis).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setRepairOnly(!repairOnly)}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${repairOnly ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-muted-foreground/30 hover:border-primary/50'}`}>
              {repairOnly && <Zap size={12} fill="currentColor" strokeWidth={3} className="text-primary-foreground" />}
            </div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">
              Filter Repair Chassis
            </label>
          </div>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 font-black text-[10px] uppercase tracking-widest px-3 py-1">
            {repairCount} Critical Repair Nodes
          </Badge>
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest px-3 py-1">
            {records.length} Telemetry Points
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border-2 overflow-hidden bg-background shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50 border-b">
            <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <TableHead className="px-6 py-4">Chassis ID</TableHead>
              <TableHead className="px-6 py-4">Event Logic</TableHead>
              <TableHead className="px-6 py-4">Time Horizon</TableHead>
              <TableHead className="px-6 py-4">Geospatial</TableHead>
              <TableHead className="px-6 py-4 text-center">Velocity</TableHead>
              <TableHead className="px-6 py-4 text-center">State</TableHead>
              <TableHead className="px-6 py-4 text-right">Flags</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Radio size={32} />
                    <p className="text-sm font-bold">No API signals detected. Synchronize system to initialize.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : records.map(r => (
              <TableRow key={r.id} className={`hover:bg-muted/30 transition-colors border-b last:border-0 ${r.is_repair_chassis ? 'bg-amber-500/[0.02]' : ''}`}>
                <TableCell className="px-6 py-4 font-mono font-black text-xs">{r.chassis_number || '—'}</TableCell>
                <TableCell className="px-6 py-4">
                  <Badge variant={r.event_type === 'asset.event' ? 'default' : 'secondary'} className="font-black text-[9px] uppercase tracking-tighter">
                    {r.event_type === 'asset.event' ? 'GEOSPATIAL' : 'SENSOR_LINK'}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {r.recorded_on ? new Date(r.recorded_on).toLocaleString() : '—'}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold truncate max-w-[150px]">{r.geofence_name || 'Open Territory'}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{r.lat?.toFixed(4)}, {r.lon?.toFixed(4)}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-center text-xs font-black">
                  {r.velocity != null ? `${r.velocity} MPH` : '0 MPH'}
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1.5">
                    {r.container_mounted ? <Container size={14} className="text-primary" /> : <Container size={14} className="text-muted-foreground opacity-20" />}
                    {r.battery_state ? <Battery size={14} className="text-emerald-500" /> : <Battery size={14} className="text-destructive" />}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  {r.is_repair_chassis && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-black text-[9px] uppercase">REPAIR_LOCK</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SystemPanel({ tableName, bucket, fileName }: {
  tableName: string; bucket: string; fileName: string
}) {
  const queryClient = useQueryClient()
  
  const { data: records = [], isLoading: loading } = useQuery({
    queryKey: [tableName, 'snapshot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('_load_ts', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data || []) as BbrRecord[]
    }
  })

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  return (
    <div className="space-y-8">
      <GpsUploadZone
        requiredFileName={fileName}
        bucket={bucket}
        table={tableName}
        accept=".csv"
        uploadDates={uploadDates}
        onExtracted={() => queryClient.invalidateQueries({ queryKey: [tableName, 'snapshot'] })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ingested Nodes</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{records.length.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Unique Assets</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{uniqueChassis.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chronological Epochs</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-black">{uploadDates.length}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b py-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History size={18} className="text-primary" /> Snapshot Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <TableHead className="px-6 py-4">Chassis</TableHead>
                  <TableHead className="px-6 py-4">Location</TableHead>
                  <TableHead className="px-6 py-4">Status</TableHead>
                  <TableHead className="px-6 py-4 text-center">Diagnostics</TableHead>
                  <TableHead className="px-6 py-4 text-right">Provenance</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-24 text-center text-muted-foreground italic">No archival snapshots found.</TableCell>
                  </TableRow>
                ) : (
                  records.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="px-6 py-4 font-mono font-black text-xs">{r.chassis_number}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold">{r.geofence || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.address || 'Unknown Axis'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit font-black text-[9px] uppercase tracking-tighter">{r.movement || 'STATIC'}</Badge>
                          <span className="text-[9px] font-medium text-muted-foreground uppercase">{r.idle_for || '0s'} IDLE</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold">{r.battery || '0%'}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground">{r.container || 'EMPTY'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono text-[9px] text-muted-foreground">
                        {r._source_file?.split('/').pop()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CombinedPanel() {
  const { data: records = [], isLoading: loading } = useQuery({
    queryKey: ['v_blackberry_gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_blackberry_gps')
        .select('*')
        .order('_load_ts', { ascending: false })
        .limit(1000)
      if (error) throw error
      return (data || []) as (BbrRecord & { bbr_system: string })[]
    }
  })

  return (
    <Card className="border-none shadow-2xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b py-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Cpu size={20} className="text-primary" /> Global Radar Convergence
          </CardTitle>
          <Badge className="font-black text-[10px] uppercase tracking-widest">{records.length} TOTAL NODES</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <TableHead className="px-6 py-4">Source System</TableHead>
                <TableHead className="px-6 py-4">Asset ID</TableHead>
                <TableHead className="px-6 py-4">Geofence</TableHead>
                <TableHead className="px-6 py-4">Movement State</TableHead>
                <TableHead className="px-6 py-4">Dwell Time</TableHead>
                <TableHead className="px-6 py-4 text-right">Archival Path</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(15)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center italic opacity-30">No converged telemetry available.</TableCell>
                </TableRow>
              ) : (
                records.map(r => (
                  <TableRow key={`${r.bbr_system}-${r.id}`} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                    <TableCell className="px-6 py-4">
                      <Badge variant={r.bbr_system === 'log' ? 'default' : 'secondary'} className="font-black text-[9px] uppercase tracking-widest px-3">
                        SYSTEM::{r.bbr_system}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-mono font-black text-xs">{r.chassis_number}</TableCell>
                    <TableCell className="px-6 py-4 text-xs font-bold">{r.geofence || 'OPEN_WATER'}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className="font-black text-[9px] uppercase py-0.5">{r.movement || 'STATIC'}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">{r.idle_for || '0s'}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-[9px] text-muted-foreground">
                      {r._source_file?.split('/').pop()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BlackBerryPage() {
  const [activeTab, setActiveTab] = useState('api-tran')

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl text-primary-foreground shadow-xl shadow-primary/20">
              <Radio size={24} strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">BlackBerry Radar GPS</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Advanced Fleet State Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <GpsSyncPanel />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-muted/50 p-1.5 h-auto gap-1.5 rounded-2xl border-2">
          <TabsTrigger value="api-tran" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">API: TRAN-CORE</TabsTrigger>
          <TabsTrigger value="api-log" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">API: LOG-STREAM</TabsTrigger>
          <TabsTrigger value="upload-log" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">ARCHIVE: LOG</TabsTrigger>
          <TabsTrigger value="upload-tran" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">ARCHIVE: TRAN</TabsTrigger>
          <TabsTrigger value="combined" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg">CONVERGED VIEW</TabsTrigger>
        </TabsList>

        <TabsContent value="api-tran" className="mt-0 outline-none">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b py-6">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-primary" />
                <CardTitle className="text-lg">Radar TRAN Telemetry Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <ApiDataTable tableName="blackberry_tran_gps" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-log" className="mt-0 outline-none">
          <Card className="border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b py-6">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-primary" />
                <CardTitle className="text-lg">Radar LOG Telemetry Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <ApiDataTable tableName="blackberry_log_gps" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload-log" className="mt-0 outline-none">
          <SystemPanel tableName="blackberry_log_gps" bucket="gps-blackberry-log" fileName="BlackBerry-Radar-Fleet-State-Log.csv" />
        </TabsContent>

        <TabsContent value="upload-tran" className="mt-0 outline-none">
          <SystemPanel tableName="blackberry_tran_gps" bucket="gps-blackberry-tran" fileName="BlackBerry-Radar-Fleet-State-Tran.csv" />
        </TabsContent>

        <TabsContent value="combined" className="mt-0 outline-none">
          <CombinedPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
