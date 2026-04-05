import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CcmRecord {
  id: string
  [key: string]: unknown
}

export default function CCMPage() {
  const [records, setRecords] = useState<CcmRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('ccm_activity')
          .select('*')
          .order('date_out', { ascending: false })
          .limit(500)
        if (fetchErr) {
          // If date_out doesn't exist, try without ordering
          const retry = await supabase.from('ccm_activity').select('*').limit(500)
          if (retry.error) throw retry.error
          setRecords(retry.data || [])
          return
        }
        setRecords(data || [])
      } catch (err) {
        console.error('[CCM] load failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = search
    ? records.filter(r => String(r.chassis_number || r.chassis || '').toUpperCase().trim().includes(search.toUpperCase().trim()))
    : records

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CCM</h1>
          <p className="text-muted-foreground">Consolidated Chassis Management — Vendor Dashboard</p>
        </div>
        <Link to="/vendors/ccm/invoices/new">
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
              <CardContent><p className="text-xl font-bold">CCM</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p><span className="font-medium">Company:</span> Consolidated Chassis Management (CCM)</p>
                <p><span className="font-medium">Website:</span> <a href="https://www.ccmpool.com" className="text-primary underline" target="_blank" rel="noreferrer">www.ccmpool.com</a></p>
                <p><span className="font-medium">Phone:</span> 1-877-226-6224</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Important Notices</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">Dispute Policy</p>
                  <p className="text-sm text-yellow-700">All billing disputes must be submitted within 45 days.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search chassis number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} records</p>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity records found.</p>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chassis #</TableHead>
                    <TableHead>Pick Up Location</TableHead>
                    <TableHead>Location In</TableHead>
                    <TableHead>Days Out</TableHead>
                    <TableHead>Date Out</TableHead>
                    <TableHead>Date In</TableHead>
                    <TableHead>Pool Contract</TableHead>
                    <TableHead>Container</TableHead>
                    <TableHead>SS SCAC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{String(r.chassis_number || r.chassis || '').trim() || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.pick_up_location || r.pickup_location || '') || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.location_in || '') || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{r.days_out ?? 'N/A'}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_out as string)}</TableCell>
                      <TableCell className="text-sm">{formatDate(r.date_in as string)}</TableCell>
                      <TableCell className="text-sm">{String(r.pool_contract || '') || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.container || r.container_number || '') || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{String(r.ss_scac || '') || 'N/A'}</TableCell>
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
