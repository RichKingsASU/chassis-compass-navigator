import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/utils/dateUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Layers,
  MapPin,
  Activity as ActivityIcon,
  AlertCircle
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'

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
  const [search, setSearch] = useState('')
  const [marketFilter, setMarketFilter] = useState<string>('all')
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortCol, setSortCol] = useState<SortColumn>('date_out')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [page, setPage] = useState(0)

  const { data: allRows = [], isLoading, error } = useQuery({
    queryKey: ['dcli_activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dcli_activity')
        .select('*')
        .order('date_out', { ascending: false })
      if (error) throw error
      return data as DcliActivityRow[]
    }
  })

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

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
    setPage(0)
  }

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortCol !== col) return <ArrowUpDown size={12} className="ml-1 opacity-50" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="ml-1 text-primary" /> : <ArrowDown size={12} className="ml-1 text-primary" />
  }

  const daysClass = (days: number | null): string => {
    if (days == null) return ''
    if (days > 30) return 'text-red-600 font-black'
    if (days > 7) return 'text-orange-500 font-bold'
    return 'font-medium'
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DCLI Activity Stream</h1>
          <p className="text-muted-foreground mt-1">Raw chassis utilization and movement logs from the primary source</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-4 font-bold uppercase tracking-widest text-[10px] bg-muted/50">
            {stats.total.toLocaleString()} Records
          </Badge>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <AlertCircle size={20} />
          <p className="font-medium">{error instanceof Error ? error.message : 'Synchronization error'}</p>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Events</p>
              <ActivityIcon size={14} className="text-muted-foreground" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-black">{stats.total.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Unique Assets</p>
              <Layers size={14} className="text-muted-foreground" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-black">{stats.uniqueChassis.toLocaleString()}</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cycle Velocity</p>
              <Calendar size={14} className="text-muted-foreground" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-black">{stats.avgDays.toFixed(1)} Days</p>}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Over 7-Day Cycle</p>
              <AlertCircle size={14} className="text-orange-500" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-black text-orange-600">{stats.over7.toLocaleString()}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Filter Architecture */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex-1 min-w-[300px]">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Universal Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Chassis, container, reservation, or terminal..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0) }}
                  className="pl-10 h-10 bg-muted/20"
                />
              </div>
            </div>
            <div className="w-48">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Market Segment</Label>
              <Select value={marketFilter} onValueChange={v => { setMarketFilter(v); setPage(0) }}>
                <SelectTrigger className="h-10 border-2">
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
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Asset Configuration</Label>
              <Select value={assetTypeFilter} onValueChange={v => { setAssetTypeFilter(v); setPage(0) }}>
                <SelectTrigger className="h-10 border-2">
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
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Date Range From</Label>
              <Input type="date" className="h-10 border-2" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0) }} />
            </div>
            <div className="w-40">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Date Range To</Label>
              <Input type="date" className="h-10 border-2" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0) }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stream Table */}
      <Card className="border-none shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b">
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <TableHead className="px-6 py-4">Asset ID</TableHead>
                  <TableHead className="px-6 py-4">Reference</TableHead>
                  <TableHead className="px-6 py-4">Reservation</TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date_out')}>
                    <div className="flex items-center">Intermodal Out <SortIcon col="date_out" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort('date_in')}>
                    <div className="flex items-center">Intermodal In <SortIcon col="date_in" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4 cursor-pointer hover:text-primary transition-colors text-right" onClick={() => toggleSort('days_out')}>
                    <div className="flex items-center justify-end">Cycle <SortIcon col="days_out" /></div>
                  </TableHead>
                  <TableHead className="px-6 py-4">Config</TableHead>
                  <TableHead className="px-6 py-4">Market</TableHead>
                  <TableHead className="px-6 py-4"><div className="flex items-center gap-1"><MapPin size={10} /> Route Path</div></TableHead>
                  <TableHead className="px-6 py-4 text-right">Entity</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10} className="px-6 py-4"><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="px-6 py-20 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2">
                        <Filter size={32} strokeWidth={1} />
                        <p>No activity records match your current criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map(row => (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                      <TableCell className="px-6 py-4 font-mono font-black text-xs">{row.chassis ?? '—'}</TableCell>
                      <TableCell className="px-6 py-4 font-mono text-[11px] text-muted-foreground">{row.container ?? '—'}</TableCell>
                      <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground">{row.reservation_number ?? '—'}</TableCell>
                      <TableCell className="px-6 py-4 text-xs font-semibold">{formatDate(row.date_out)}</TableCell>
                      <TableCell className="px-6 py-4 text-xs font-semibold">{formatDate(row.date_in)}</TableCell>
                      <TableCell className={`px-6 py-4 text-right text-xs ${daysClass(row.days_out)}`}>
                        {row.days_out ? `${row.days_out}d` : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[10px] font-bold uppercase text-muted-foreground">{row.asset_type ?? '—'}</TableCell>
                      <TableCell className="px-6 py-4 text-[10px] font-black uppercase tracking-tighter text-primary/80">{row.market ?? '—'}</TableCell>
                      <TableCell className="px-6 py-4 text-[11px]">
                        <div className="flex flex-col">
                          <span className="font-semibold">{row.pick_up_location || '—'}</span>
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">{row.location_in || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase">{row.motor_carrier_scac ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-6 bg-muted/10 border-t">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
                className="h-8 border-2 font-bold px-4"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page + 1 >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="h-8 border-2 font-bold px-4"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
