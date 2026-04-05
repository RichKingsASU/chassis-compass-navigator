import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TMSSummary {
  name: string
  code: string
  table: string
  route: string
  description: string
  totalRecords: number
  lastSync: string
  loading: boolean
}

const TMS_SYSTEMS = [
  { name: 'Mercury Gate', code: 'MG', table: 'mg_tms', route: '/tms/mercury-gate', description: 'MercuryGate TMS — Load planning and tracking' },
  { name: 'Port Pro', code: 'PP', table: 'ytd_loads', route: '/tms/port-pro', description: 'Port Pro TMS — YTD Loads' },
]

export default function TMSData() {
  const [systems, setSystems] = useState<TMSSummary[]>(
    TMS_SYSTEMS.map(s => ({ ...s, totalRecords: 0, lastSync: '', loading: true }))
  )
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        TMS_SYSTEMS.map(async (sys) => {
          try {
            const { count, error } = await supabase.from(sys.table).select('id', { count: 'exact', head: true })
            if (error) return { ...sys, totalRecords: 0, lastSync: '', loading: false }
            return { ...sys, totalRecords: count || 0, lastSync: '', loading: false }
          } catch {
            return { ...sys, totalRecords: 0, lastSync: '', loading: false }
          }
        })
      )
      setSystems(results)
      setTotalRecords(results.reduce((sum, s) => sum + s.totalRecords, 0))
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">TMS Data</h1>
        <p className="text-muted-foreground">Transportation Management System data sources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total TMS Records</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">TMS Systems</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{TMS_SYSTEMS.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Integrations</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{systems.filter(s => s.totalRecords > 0).length}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {sys.loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : (
                <div className="p-3 bg-muted rounded text-center">
                  <p className="text-2xl font-bold">{sys.totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              )}
              <Link to={sys.route}>
                <Button className="w-full" variant="outline">View TMS Data</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
