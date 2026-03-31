import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DcliActivityRow {
  id: number
  chassis: string | null
  container: string | null
  date_out: string | null
  date_in: string | null
  days_out: number | null
  market: string | null
  asset_type: string | null
  pick_up_location: string | null
  reservation_number: string | null
  motor_carrier_scac: string | null
  pool_contract: string | null
  location_in: string | null
}

type SortColumn = 'date_out' | 'date_in' | 'days_out'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 50

export default function DCLIActivity() {
  const [allRows, setAllRows] = useState<DcliActivityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [marketFilter, setMarketFilter] = useState<string>('all')
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortCol, setSortCol] = useState<SortColumn>('date_out')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [page, setPage] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('dcli_activity')
          .select('*')
          .order('date_out', { ascending: false })

        if (fetchErr) throw fetchErr
        setAllRows(data || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const markets = useMemo(() => {
    const set = new Set<string>()
    allRows.forEach(r => { if (r.market) set.add(r.market) })
    return Array.from(set).sort()
  }, [allRows])

  const assetTypes = useMemo(() => {
    const set = new Set<string>()
    allRows.forEach(r => { if (r.asset_type) set.add(r.asset_type) })
    return Array.from(set).sort()
  }, [allRows])

  const filtered = useMemo(() => {
    let result = allRows

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        (r.chassis?.toLowerCase().includes(q)) ||
        (r.container?.toLowerCase().includes(q)) ||
        (r.reservation_number?.toLowerCase().includes(q)) ||
        (r.pick_up_location?.toLowerCase().includes(q)) ||
        (r.location_in?.toLowerCase().includes(q))
      )
    }

    if (marketFilter !== 'all') {
      result = result.filter(r => r.market === marketFilter)
    }

    if (assetTypeFilter !== 'all') {
      result = result.filter(r => r.asset_type === assetTypeFilter)
    }

    if (dateFrom) {
      result = result.filter(r => r.date_out && r.date_out >= dateFrom)
    }
    if (dateTo) {
      result = result.filter(r => r.date_out && r.date_out <= dateTo)
    }

    result = [...result].sort((a, b) => {
      const av = a[sortCol]
      const bv = b[sortCol]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [allRows, search, marketFilter, assetTypeFilter, dateFrom, dateTo, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const stats = useMemo(() => {
    const uniqueChassis = new Set(filtered.map(r => r.chassis).filter(Boolean)).size
    const daysValues = filtered.map(r => r.days_out).filter((d): d is number => d != null)
    const avgDays = daysValues.length > 0 ? daysValues.reduce((s, v) => s + v, 0) / daysValues.length : 0
    const over7 = daysValues.filter(d => d > 7).length
    return { total: filtered.length, uniqueChassis, avgDays, over7 }
  }, [filtered])

  function toggleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
    setPage(0)
  }

  function sortIndicator(col: SortColumn) {
    if (sortCol !== col) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  function daysClass(days: number | null): string {
    if (days == null) return ''
    if (days > 30) return 'text-red-600 font-semibold'
    if (days > 7) return 'text-orange-500 font-semibold'
    return ''
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DCLI Activity</h1>
        <p className="text-muted-foreground">
          Chassis activity from dcli_activity
        </p>
      </div>

      {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Unique Chassis</p>
            <p className="text-2xl font-bold">{stats.uniqueChassis.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Avg Days Out</p>
            <p className="text-2xl font-bold">{stats.avgDays.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">&gt; 7 Days Out</p>
            <p className="text-2xl font-bold">{stats.over7.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <label className="text-sm font-medium mb-1 block">Search</label>
          <Input
            placeholder="Chassis, container, reservation, location..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="w-48">
          <label className="text-sm font-medium mb-1 block">Market</label>
          <Select value={marketFilter} onValueChange={v => { setMarketFilter(v); setPage(0) }}>
            <SelectTrigger>
              <SelectValue placeholder="All Markets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {markets.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <label className="text-sm font-medium mb-1 block">Asset Type</label>
          <Select value={assetTypeFilter} onValueChange={v => { setAssetTypeFilter(v); setPage(0) }}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {assetTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-sm font-medium mb-1 block">Date Out From</label>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }} />
        </div>
        <div className="w-40">
          <label className="text-sm font-medium mb-1 block">Date Out To</label>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }} />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log — {filtered.length.toLocaleString()} records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading activity...</p>
          ) : pageRows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No matching records found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chassis</TableHead>
                      <TableHead>Container</TableHead>
                      <TableHead>Reservation #</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date_out')}>
                        Date Out{sortIndicator('date_out')}
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date_in')}>
                        Date In{sortIndicator('date_in')}
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('days_out')}>
                        Days{sortIndicator('days_out')}
                      </TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>Pick Up Location</TableHead>
                      <TableHead>Return Location</TableHead>
                      <TableHead>Carrier SCAC</TableHead>
                      <TableHead>Pool</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.chassis ?? '—'}</TableCell>
                        <TableCell>{row.container ?? '—'}</TableCell>
                        <TableCell>{row.reservation_number ?? '—'}</TableCell>
                        <TableCell>{formatDate(row.date_out)}</TableCell>
                        <TableCell>{formatDate(row.date_in)}</TableCell>
                        <TableCell className={`text-right ${daysClass(row.days_out)}`}>
                          {row.days_out ?? '—'}
                        </TableCell>
                        <TableCell>{row.asset_type ?? '—'}</TableCell>
                        <TableCell>{row.market ?? '—'}</TableCell>
                        <TableCell>{row.pick_up_location ?? '—'}</TableCell>
                        <TableCell>{row.location_in ?? '—'}</TableCell>
                        <TableCell>{row.motor_carrier_scac ?? '—'}</TableCell>
                        <TableCell>{row.pool_contract ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
