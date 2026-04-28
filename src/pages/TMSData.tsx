import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'

const TMS_SYSTEMS = [
  { name: 'Mercury Gate', code: 'MG', table: 'mg_data', route: '/tms/mercury-gate', description: 'MercuryGate TMS — Load planning and tracking' },
  { name: 'Port Pro', code: 'PP', table: 'portpro_tms', route: '/tms/port-pro', description: 'Port Pro TMS — Port drayage management' },
]

export default function TMSData() {
  const { data: systems = TMS_SYSTEMS.map(s => ({ ...s, totalRecords: 0, lastSync: '' })), isLoading } = useQuery({
    queryKey: ['tms_systems_overview'],
    queryFn: async () => {
      const results = await Promise.all(
        TMS_SYSTEMS.map(async (sys) => {
          try {
            // Optimization: Just get the count and the latest date, not all rows
            const { count, error: countErr } = await supabase
              .from(sys.table)
              .select('*', { count: 'exact', head: true })
              
            const { data: latestRow, error: dateErr } = await supabase
              .from(sys.table)
              .select('created_at')
              .order('created_at', { ascending: false })
              .limit(1)

            return {
              ...sys,
              totalRecords: countErr ? 0 : (count || 0),
              lastSync: (dateErr || !latestRow || latestRow.length === 0) ? '' : latestRow[0].created_at,
            }
          } catch {
            return { ...sys, totalRecords: 0, lastSync: '' }
          }
        })
      )
      return results
    }
  })

  const totalRecords = systems.reduce((sum, s) => sum + s.totalRecords, 0)
  const activeIntegrations = systems.filter(s => s.totalRecords > 0).length

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">TMS Data</h1>
        <p className="text-muted-foreground mt-2">Transportation Management System data sources and integration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total TMS Records</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-9 w-20" /> : <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">TMS Systems</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{TMS_SYSTEMS.length}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Integrations</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-bold">{activeIntegrations}</p>}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {systems.map((sys) => (
          <Card key={sys.code} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{sys.name}</CardTitle>
                <Badge variant={sys.totalRecords > 0 ? 'default' : 'outline'}>{sys.code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{sys.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted rounded text-center">
                      <p className="text-2xl font-bold">{sys.totalRecords.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Records</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded text-center">
                      <p className="text-xs font-medium text-blue-700">Last Sync</p>
                      <p className="text-xs text-blue-600">{sys.lastSync ? formatDate(sys.lastSync) : 'Never'}</p>
                    </div>
                  </div>
                  <Link to={sys.route}>
                    <Button className="w-full" variant="outline">View TMS Data</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
