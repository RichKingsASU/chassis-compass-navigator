import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'

interface UnifiedRow {
  gps_source: string
  chassis_number: string
  landmark: string | null
  gps_date: string
  gps_status: string | null
  dormant_days: number | null
  latitude: number | null
  longitude: number | null
}

interface MclRow extends UnifiedRow {
  lessor: string | null
  mcl_region: string | null
  lease_rate_per_day: number | null
  chassis_type: string | null
  mcl_status: string | null
}

interface LandmarkRow {
  id: number
  name: string
  lat: number
  lon: number
  source: string
  created_at: string
}

const DORMANCY_BUCKETS = [
  { key: 'active',   label: 'Active (<1d)',     color: '#10b981', test: (d: number) => d < 1 },
  { key: 'watched',  label: 'Watched (1-3d)',   color: '#3b82f6', test: (d: number) => d >= 1 && d < 3 },
  { key: 'idle',     label: 'Idle (3-7d)',      color: '#fbbf24', test: (d: number) => d >= 3 && d < 7 },
  { key: 'dormant',  label: 'Dormant (7-30d)',  color: '#f59e0b', test: (d: number) => d >= 7 && d < 30 },
  { key: 'critical', label: 'Critical (30d+)',  color: '#ef4444', test: (d: number) => d >= 30 },
]

const SOURCE_COLORS: Record<string, string> = {
  FLEETLOCATE: '#3b82f6',
  BLACKBERRY_LOG: '#8b5cf6',
  BLACKBERRY_TRAN: '#06b6d4',
  ANYTREK: '#10b981',
  SAMSARA: '#f59e0b',
  FLEETVIEW: '#ec4899',
}

export default function GpsAnalytics() {
  const [landmarkSearch, setLandmarkSearch] = useState('')

  const { data: unified = [], isLoading: unifiedLoading } = useQuery<UnifiedRow[]>({
    queryKey: ['gps_analytics_unified'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_chassis_gps_unified')
        .select('gps_source, chassis_number, landmark, gps_date, gps_status, dormant_days, latitude, longitude')
      if (error) throw error
      return (data || []) as UnifiedRow[]
    },
  })

  const { data: mcl = [], isLoading: mclLoading } = useQuery<MclRow[]>({
    queryKey: ['gps_analytics_mcl'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_chassis_gps_mcl').select('*')
      if (error) throw error
      return (data || []) as MclRow[]
    },
  })

  const { data: landmarks = [] } = useQuery<LandmarkRow[]>({
    queryKey: ['gps_analytics_landmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landmark_coords')
        .select('id, name, lat, lon, source, created_at')
        .order('name')
      if (error) throw error
      return (data || []) as LandmarkRow[]
    },
  })

  const totalTracked = unified.length
  const movingCount = useMemo(() => unified.filter(r => r.gps_status === 'Moving').length, [unified])
  const dormant7Plus = useMemo(() => unified.filter(r => (Number(r.dormant_days) || 0) >= 7).length, [unified])
  const avgDormant = useMemo(() => {
    const dormants = unified.filter(r => (Number(r.dormant_days) || 0) >= 1)
    if (dormants.length === 0) return 0
    const sum = dormants.reduce((s, r) => s + (Number(r.dormant_days) || 0), 0)
    return sum / dormants.length
  }, [unified])

  const dormancyDistribution = useMemo(() =>
    DORMANCY_BUCKETS.map(b => ({
      label: b.label,
      count: unified.filter(r => b.test(Number(r.dormant_days) || 0)).length,
      color: b.color,
    }))
  , [unified])

  const sourceCoverage = useMemo(() => {
    const counts: Record<string, number> = {}
    unified.forEach(r => {
      counts[r.gps_source] = (counts[r.gps_source] || 0) + 1
    })
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  }, [unified])

  const monthlyActivity = useMemo(() => {
    const counts: Record<string, number> = {}
    unified.forEach(r => {
      if (!r.gps_date) return
      const d = new Date(r.gps_date)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-24)
  }, [unified])

  const topDormant = useMemo(() => {
    return [...mcl]
      .filter(r => Number(r.dormant_days) > 0)
      .sort((a, b) => (Number(b.dormant_days) || 0) - (Number(a.dormant_days) || 0))
      .slice(0, 20)
  }, [mcl])

  const topLocations = useMemo(() => {
    const counts: Record<string, number> = {}
    unified.forEach(r => {
      if (!r.landmark) return
      counts[r.landmark] = (counts[r.landmark] || 0) + 1
    })
    return Object.entries(counts)
      .map(([landmark, count]) => ({ landmark, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
  }, [unified])

  const filteredLandmarks = useMemo(() => {
    if (!landmarkSearch) return landmarks
    const q = landmarkSearch.toLowerCase()
    return landmarks.filter(l => l.name.toLowerCase().includes(q))
  }, [landmarks, landmarkSearch])

  const loading = unifiedLoading || mclLoading

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GPS Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Dormancy distribution, source coverage, and idle cost analysis
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Tracked</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{totalTracked.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Currently Moving</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-emerald-600">{movingCount.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Dormant 7d+</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-amber-600">{dormant7Plus.toLocaleString()}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Avg Dormant Days</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold">{avgDormant.toFixed(1)}d</p>}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dormancy distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dormancy Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dormancyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString()} />
                <Bar dataKey="count">
                  {dormancyDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source coverage */}
        <Card>
          <CardHeader><CardTitle className="text-base">Source Coverage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceCoverage}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  label={(entry: any) => `${entry.count}`}
                >
                  {sourceCoverage.map((s, idx) => (
                    <Cell key={idx} fill={SOURCE_COLORS[s.source] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => Number(v).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly activity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Activity (last 24 months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyActivity}>
              <defs>
                <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => Number(v).toLocaleString()} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#indigoGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top dormant chassis */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 20 Dormant Chassis</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Chassis #</th>
                <th className="text-left p-2 font-medium">Source</th>
                <th className="text-left p-2 font-medium">Landmark</th>
                <th className="text-right p-2 font-medium">Dormant Days</th>
                <th className="text-left p-2 font-medium">Last Ping</th>
                <th className="text-left p-2 font-medium">Lessor</th>
                <th className="text-left p-2 font-medium">Region</th>
                <th className="text-right p-2 font-medium">Daily Rate</th>
                <th className="text-right p-2 font-medium">Accrued Cost</th>
              </tr>
            </thead>
            <tbody>
              {topDormant.map((r, idx) => {
                const days = Number(r.dormant_days) || 0
                const rate = r.lease_rate_per_day != null ? Number(r.lease_rate_per_day) : null
                const accrued = rate != null && days > 0 ? rate * days : null
                const rowClass = days >= 30 ? 'bg-red-50' : days >= 7 ? 'bg-amber-50' : ''
                return (
                  <tr key={`${r.chassis_number}-${idx}`} className={`border-b ${rowClass}`}>
                    <td className="p-2 font-mono">{r.chassis_number}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{r.gps_source}</Badge></td>
                    <td className="p-2 truncate max-w-[180px]">{r.landmark || '—'}</td>
                    <td className="p-2 text-right font-medium">{Math.round(days)}d</td>
                    <td className="p-2">{r.gps_date ? new Date(r.gps_date).toLocaleDateString() : '—'}</td>
                    <td className="p-2">{r.lessor || '—'}</td>
                    <td className="p-2">{r.mcl_region || '—'}</td>
                    <td className="p-2 text-right">{rate != null ? `$${rate.toFixed(2)}` : '—'}</td>
                    <td className="p-2 text-right font-semibold">{accrued != null ? `$${accrued.toFixed(2)}` : '—'}</td>
                  </tr>
                )
              })}
              {topDormant.length === 0 && !loading && (
                <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">No dormant chassis</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Top locations */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 15 Locations by Chassis Count</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLocations} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="landmark" type="category" tick={{ fontSize: 10 }} width={150} />
              <Tooltip formatter={(v: unknown) => Number(v).toLocaleString()} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Landmark reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">Landmark Reference ({landmarks.length})</CardTitle>
            <Input
              placeholder="Search landmarks..."
              value={landmarkSearch}
              onChange={e => setLandmarkSearch(e.target.value)}
              className="max-w-xs h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Source</th>
                  <th className="text-right p-2 font-medium">Lat</th>
                  <th className="text-right p-2 font-medium">Lon</th>
                </tr>
              </thead>
              <tbody>
                {filteredLandmarks.map(l => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2 font-medium">{l.name}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.source}</Badge></td>
                    <td className="p-2 text-right font-mono">{Number(l.lat).toFixed(4)}</td>
                    <td className="p-2 text-right font-mono">{Number(l.lon).toFixed(4)}</td>
                  </tr>
                ))}
                {filteredLandmarks.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No matches</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
