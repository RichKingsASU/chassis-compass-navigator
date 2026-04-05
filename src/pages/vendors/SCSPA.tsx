import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ScspaRecord {
  id: string
  [key: string]: unknown
}

export default function SCSPAPage() {
  const [records, setRecords] = useState<ScspaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('scspa_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(500)
        if (fetchErr) {
          const retry = await supabase.from('scspa_activity').select('*').limit(500)
          if (retry.error) throw retry.error
          setRecords(retry.data || [])
          return
        }
        setRecords(data || [])
      } catch (err) {
        console.error('[SCSPA] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SCSPA</h1>
          <p className="text-muted-foreground">South Carolina State Ports Authority — Vendor Dashboard</p>
        </div>
        <Link to="/vendors/scspa/invoices/new">
          <Button>+ Upload Invoice</Button>
        </Link>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">{error}</div>}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="activity">Activity ({records.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{records.length}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Chassis</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {new Set(records.map(r => String(r.chassis_number || r.chassis || '').trim()).filter(Boolean)).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Provider</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">SCSPA</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> South Carolina State Ports Authority</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.scspa.com" className="text-primary underline" target="_blank" rel="noreferrer">www.scspa.com</a></p>
                <p><span className="font-medium">Phone:</span> 1-843-577-8121</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Port Operations</p>
                  <p className="text-sm text-yellow-700">SCSPA handles chassis operations at Charleston port terminals.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : records.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity records found.</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Pick Up Location</TableHead>
                    <TableHead>Pool Contract</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{String(r.chassis_number || r.chassis || '').trim() || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_out as string)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_in as string)}</TableCell>
                      <TableCell className="text-sm">{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.pick_up_location || '') || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.pool_contract || '') || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
