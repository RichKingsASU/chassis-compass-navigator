import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InvoiceLine {
  id: string
  chassis_number: string
  container_number: string
  provider: string
  invoice_number: string
  pickup_date: string
  return_date: string
  days: number
  rate: number
  amount: number
  status: string
  created_at: string
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status?.toLowerCase()) {
    case 'matched': return 'default'
    case 'disputed': return 'destructive'
    case 'pending': return 'secondary'
    case 'unmatched': return 'destructive'
    default: return 'outline'
  }
}

export default function InvoicesList() {
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [filtered, setFiltered] = useState<InvoiceLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data, error: fetchErr } = await supabase
          .from('invoice_lines')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)
        if (fetchErr) throw fetchErr
        setLines(data || [])
        setFiltered(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice lines')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let result = lines
    if (search) {
      const q = search.toUpperCase()
      result = result.filter(l =>
        l.chassis_number?.includes(q) ||
        l.container_number?.includes(q) ||
        l.invoice_number?.includes(q)
      )
    }
    if (providerFilter !== 'all') result = result.filter(l => l.provider === providerFilter)
    if (statusFilter !== 'all') result = result.filter(l => l.status?.toLowerCase() === statusFilter)
    setFiltered(result)
  }, [search, providerFilter, statusFilter, lines])

  const providers = [...new Set(lines.map(l => l.provider).filter(Boolean))]
  const totalAmount = lines.reduce((sum, l) => sum + (l.amount || 0), 0)
  const disputedCount = lines.filter(l => l.status?.toLowerCase() === 'disputed').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoice Lines</h1>
        <p className="text-muted-foreground">All invoice line items across all vendors</p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Lines</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{lines.length.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Disputed</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{disputedCount}</p></CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search chassis, container, invoice#..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border rounded-md text-sm"
        />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
            <SelectItem value="unmatched">Unmatched</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearch(''); setProviderFilter('all'); setStatusFilter('all') }}>Clear</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? <p className="text-muted-foreground">Loading invoice lines...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chassis #</TableHead>
                  <TableHead>Container #</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Return</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No invoice lines found.</TableCell></TableRow>
                ) : filtered.slice(0, 100).map(line => (
                  <TableRow key={line.id}>
                    <TableCell className="font-mono text-sm">{line.chassis_number}</TableCell>
                    <TableCell className="font-mono text-sm">{line.container_number || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{line.provider}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{line.invoice_number}</TableCell>
                    <TableCell className="text-sm">{formatDate(line.pickup_date)}</TableCell>
                    <TableCell className="text-sm">{formatDate(line.return_date)}</TableCell>
                    <TableCell>{line.days}</TableCell>
                    <TableCell>{formatCurrency(line.amount)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(line.status)}>{line.status || 'N/A'}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Link to={`/invoices/line/${line.id}`}><Button variant="outline" size="sm">View</Button></Link>
                      <Link to={`/invoices/line/${line.id}/dispute`}><Button variant="destructive" size="sm">Dispute</Button></Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtered.length > 100 && <p className="text-sm text-muted-foreground text-center mt-2">Showing 100 of {filtered.length} lines.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
