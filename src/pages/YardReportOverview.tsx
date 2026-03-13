import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface YardSummary {
  name: string
  code: string
  table: string
  route: string
  description: string
  totalReports: number
  lastReport: string
  loading: boolean
}

const YARDS = [
  { name: 'POLA / PIER S', code: 'POLA', table: 'yard_pola', route: '/yards/pola', description: 'Port of Los Angeles — Pier S Terminal' },
  { name: 'JED Yard', code: 'JED', table: 'yard_jed', route: '/yards/jed', description: 'JED Intermodal Yard' },
]

export default function YardReportOverview() {
  const [yards, setYards] = useState<YardSummary[]>(
    YARDS.map(y => ({ ...y, totalReports: 0, lastReport: '', loading: true }))
  )

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        YARDS.map(async (yard) => {
          try {
            const { data } = await supabase.from(yard.table).select('created_at').order('created_at', { ascending: false })
            const reports = data || []
            return {
              ...yard,
              totalReports: reports.length,
              lastReport: reports[0]?.created_at || '',
              loading: false,
            }
          } catch {
            return { ...yard, totalReports: 0, lastReport: '', loading: false }
          }
        })
      )
      setYards(results)
    }
    load()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yard Reports</h1>
        <p className="text-muted-foreground">Overview of all yard locations and chassis inventory reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {yards.map((yard) => (
          <Card key={yard.code} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{yard.name}</CardTitle>
                <Badge variant="outline">{yard.code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{yard.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {yard.loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded text-center">
                    <p className="text-2xl font-bold">{yard.totalReports}</p>
                    <p className="text-xs text-muted-foreground">Total Reports</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded text-center">
                    <p className="text-xs font-medium text-blue-700">Last Report</p>
                    <p className="text-xs text-blue-600">{yard.lastReport ? formatDate(yard.lastReport) : 'No reports'}</p>
                  </div>
                </div>
              )}
              <Link to={yard.route}>
                <Button className="w-full" variant="outline">View Yard</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
