import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('dashboard')

  const { data: records = [], isLoading: loading, error } = useQuery({
    queryKey: ['fleetlocate_gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fleetlocate_gps')
        .select('*')
        .order('_load_ts', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data || []) as FleetlocateRecord[]
    }
  })

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const dormantOver3 = records.filter(r => (r.dormant_days ?? 0) >= 3).length
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['fleetlocate_gps'] })
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">FleetLocate GPS</h1>
        <p className="text-muted-foreground mt-2">Spireon / Solera FleetLocate — TRAC chassis tracking</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
          {error instanceof Error ? error.message : 'An error occurred while loading data'}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{records.length.toLocaleString()}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unique Chassis</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{uniqueChassis.toLocaleString()}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Days Uploaded</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{uploadDates.length}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dormant 3+ Days</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold text-amber-600">{dormantOver3.toLocaleString()}</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Fleet Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No data uploaded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {records.slice(0, 10).map(r => (
                    <li key={r.id} className="flex justify-between items-center text-sm border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-base">{r.chassis_number}</span>
                        <span className="text-muted-foreground truncate max-w-md">
                          {r.landmark || [r.city, r.state].filter(Boolean).join(', ') || 'Location unknown'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${(r.dormant_days ?? 0) >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.duration || 'Active'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {r.last_event_date ? new Date(r.last_event_date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-8 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>FleetLocate Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chassis #</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Battery</TableHead>
                        <TableHead>Last Event</TableHead>
                        <TableHead>Source File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            No data uploaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm font-medium">{r.chassis_number}</TableCell>
                            <TableCell className="text-sm">{r.group_name || '—'}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col">
                                <span>{r.landmark || '—'}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-xs">
                                  {[r.city, r.state].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.dormant_days != null ? (
                                <Badge variant={r.dormant_days >= 3 ? 'destructive' : 'outline'} className="font-medium">
                                  {r.duration}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="font-normal">{r.status || '—'}</Badge></TableCell>
                            <TableCell className="text-sm">{r.battery_status || '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.last_event_date ? new Date(r.last_event_date).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[150px]" title={r._source_file || ''}>
                              {r._source_file?.split('/').pop() || '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-8 mt-0">
          <GpsUploadZone
            requiredFileName="FleetLocate.csv"
            bucket="gps-fleetlocate"
            table="fleetlocate_gps"
            accept=".csv"
            uploadDates={uploadDates}
            onExtracted={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
