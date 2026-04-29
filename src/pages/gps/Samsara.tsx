import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GpsUploadZone } from '@/components/gps/GpsUploadZone'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('upload')

  const { data: records = [], isLoading: loading, error } = useQuery({
    queryKey: ['samsara_gps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('samsara_gps')
        .select('*')
        .order('_load_ts', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data || []) as SamsaraRecord[]
    }
  })

  const uniqueChassis = new Set(records.map(r => r.chassis_number)).size
  const dormantOver3 = records.filter(r => (r.dormant_days ?? 0) >= 3).length
  const uploadDates = [...new Set(records.map(r => r._source_file?.split('/')[0]).filter((d): d is string => !!d))]

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['samsara_gps'] })
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Samsara GPS</h1>
        <p className="text-muted-foreground mt-2">Samsara Fleet Telematics — Real-time tracking and data management</p>
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
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No data uploaded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {records.slice(0, 10).map(r => (
                    <li key={r.id} className="flex justify-between items-center text-sm border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-base">{r.chassis_number}</span>
                        <span className="text-muted-foreground truncate max-w-md">{r.landmark || r.address || 'Location unknown'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${(r.dormant_days ?? 0) >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.dormant_days != null ? `${r.dormant_days}d dormant` : 'Active'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">{r.device_last_connected || 'Unknown connection'}</span>
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
              <CardTitle>GPS Data History</CardTitle>
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
                        <TableHead>Fleet/Tag</TableHead>
                        <TableHead>Landmark</TableHead>
                        <TableHead>Dormant Days</TableHead>
                        <TableHead>Last Connection</TableHead>
                        <TableHead>Source File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                            No data uploaded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-sm font-medium">{r.chassis_number}</TableCell>
                            <TableCell className="text-sm">{r.tag_name || '—'}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex flex-col">
                                <span>{r.landmark || '—'}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-xs">{r.address}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.dormant_days != null ? (
                                <Badge variant={r.dormant_days >= 3 ? 'destructive' : 'outline'} className="font-medium">
                                  {r.dormant_days}d
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.device_last_connected || '—'}</TableCell>
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
            requiredFileName="KF Chassis Report.xlsx"
            bucket="gps-samsara"
            table="samsara_gps"
            accept=".xlsx,.xls"
            uploadDates={uploadDates}
            onExtracted={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
