import { useEffect, useMemo, useState } from 'react'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import DeckGL from '@deck.gl/react'
import { ScatterplotLayer } from '@deck.gl/layers'
import type { PickingInfo } from '@deck.gl/core'
import { format, parseISO, isValid } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChassisGps {
  gps_source: string
  chassis_number: string | null
  landmark: string | null
  address: string | null
  latitude: number
  longitude: number
  gps_date: string | null
  dormant_days: number | null
  gps_status: string | null
}

type ColorRGB = [number, number, number]

const SOURCE_COLORS: Record<string, ColorRGB> = {
  FLEETLOCATE: [245, 158, 11],
  ANYTREK: [139, 92, 246],
  BLACKBERRY_LOG: [16, 185, 129],
  BLACKBERRY_TRAN: [59, 130, 246],
  SAMSARA: [6, 182, 212],
}

const DEFAULT_COLOR: ColorRGB = [107, 114, 128]

function colorFor(source: string | null | undefined): ColorRGB {
  if (!source) return DEFAULT_COLOR
  return SOURCE_COLORS[source] ?? DEFAULT_COLOR
}

function rgbCss(c: ColorRGB, alpha = 1): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
}

function formatPing(value: string | null): string {
  if (!value) return 'N/A'
  const d = parseISO(value)
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : 'Invalid date'
}

const INITIAL_VIEW_STATE = {
  longitude: -118.2,
  latitude: 33.77,
  zoom: 9,
  pitch: 0,
  bearing: 0,
}

export default function ChassisTracker() {
  const [rows, setRows] = useState<ChassisGps[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>({})
  const [minDormantDays, setMinDormantDays] = useState<number>(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: err } = await supabase
          .from('v_chassis_gps_unified')
          .select(
            'gps_source, chassis_number, landmark, address, latitude, longitude, gps_date, dormant_days, gps_status'
          )
          .not('latitude', 'is', null)

        if (err) throw err
        if (cancelled) return

        const cleaned = ((data ?? []) as ChassisGps[]).filter(
          (r) =>
            r.latitude != null &&
            r.longitude != null &&
            !Number.isNaN(Number(r.latitude)) &&
            !Number.isNaN(Number(r.longitude))
        )
        setRows(cleaned)

        const sources = Array.from(new Set(cleaned.map((r) => r.gps_source).filter(Boolean)))
        setEnabledSources((prev) => {
          const next: Record<string, boolean> = { ...prev }
          for (const s of sources) if (next[s] === undefined) next[s] = true
          return next
        })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load GPS data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const s = r.gps_source || 'UNKNOWN'
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [rows])

  const allSources = useMemo(() => Object.keys(sourceCounts).sort(), [sourceCounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (enabledSources[r.gps_source] === false) return false
      if (minDormantDays > 0 && (r.dormant_days ?? 0) < minDormantDays) return false
      if (q && !(r.chassis_number ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, enabledSources, minDormantDays, search])

  const layers = useMemo(
    () => [
      new ScatterplotLayer<ChassisGps>({
        id: 'chassis-points',
        data: filtered,
        getPosition: (d) => [Number(d.longitude), Number(d.latitude)],
        getFillColor: (d) => colorFor(d.gps_source),
        getRadius: 300,
        radiusMinPixels: 5,
        radiusMaxPixels: 18,
        pickable: true,
        opacity: 0.85,
        stroked: false,
      }),
    ],
    [filtered]
  )

  const renderTooltip = ({ object }: PickingInfo<ChassisGps>) => {
    if (!object) return null
    const color = colorFor(object.gps_source)
    const dormant = object.dormant_days
    return {
      html: `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 240px;">
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 16px; font-weight: 700; margin-bottom: 6px;">
            ${object.chassis_number ?? 'Unknown'}
          </div>
          <div style="display:inline-block; padding: 2px 8px; border-radius: 9999px; background: ${rgbCss(color, 0.18)}; color: ${rgbCss(color)}; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 8px;">
            ${object.gps_source ?? 'UNKNOWN'}
          </div>
          ${object.landmark ? `<div style="font-size: 12px; margin-bottom: 2px;"><strong>Landmark:</strong> ${object.landmark}</div>` : ''}
          <div style="font-size: 12px; margin-bottom: 2px;"><strong>Address:</strong> ${object.address ?? '—'}</div>
          <div style="font-size: 12px; margin-bottom: 2px;"><strong>Last Ping:</strong> ${formatPing(object.gps_date)}</div>
          ${
            dormant != null
              ? `<div style="font-size: 12px; color: ${dormant > 7 ? '#dc2626' : '#374151'}; font-weight: ${dormant > 7 ? 600 : 400};">${dormant} days dormant</div>`
              : ''
          }
        </div>
      `,
      style: {
        backgroundColor: 'rgba(255,255,255,0.98)',
        color: '#111827',
        padding: '10px 12px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        border: '1px solid rgba(0,0,0,0.08)',
      },
    }
  }

  const toggleSource = (source: string, value: boolean) => {
    setEnabledSources((prev) => ({ ...prev, [source]: value }))
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
      <aside className="w-[280px] shrink-0 border-r bg-background flex flex-col">
        <div className="px-4 py-4 border-b">
          <h2 className="text-lg font-semibold">Chassis Tracker</h2>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">{filtered.length.toLocaleString()}</Badge>
            <span className="text-xs text-muted-foreground">
              of {rows.length.toLocaleString()} chassis
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Search
              </div>
              <Input
                placeholder="Chassis number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                GPS Source
              </div>
              <div className="space-y-2">
                {allSources.length === 0 && (
                  <div className="text-xs text-muted-foreground">No sources</div>
                )}
                {allSources.map((source) => {
                  const color = colorFor(source)
                  const checked = enabledSources[source] !== false
                  return (
                    <label
                      key={source}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleSource(source, v === true)}
                      />
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: rgbCss(color) }}
                      />
                      <span className="flex-1 truncate">{source}</span>
                      <span className="text-xs text-muted-foreground">
                        {sourceCounts[source]?.toLocaleString() ?? 0}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Dormant Days
              </div>
              <label className="text-sm text-muted-foreground block mb-1">
                Show chassis dormant ≥
              </label>
              <Input
                type="number"
                min={0}
                value={minDormantDays}
                onChange={(e) => setMinDormantDays(Math.max(0, Number(e.target.value) || 0))}
              />
              <div className="text-xs text-muted-foreground mt-1">0 shows all</div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Legend
              </div>
              <div className="space-y-1.5">
                {Object.keys(SOURCE_COLORS).map((source) => (
                  <div key={source} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: rgbCss(SOURCE_COLORS[source]) }}
                    />
                    <span>{source}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: rgbCss(DEFAULT_COLOR) }}
                  />
                  <span>Other</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="rounded-md bg-background/90 border px-4 py-3 text-sm text-muted-foreground shadow">
              No GPS data available
            </div>
          </div>
        )}

        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller
          layers={layers}
          getTooltip={renderTooltip}
          style={{ position: 'absolute', inset: '0' }}
        >
          <Map
            reuseMaps
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
            style={{ width: '100%', height: '100%' }}
          />
        </DeckGL>
      </div>
    </div>
  )
}
