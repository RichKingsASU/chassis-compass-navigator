import { useState, useCallback, useMemo } from 'react'
import Map, { NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl'
import { DeckGL } from '@deck.gl/react'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useChassisGps, ChassisGpsPoint } from '@/hooks/useChassisGps'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11'

const SOURCE_COLORS: Record<string, [number, number, number, number]> = {
  FLEETLOCATE:     [245, 158, 11,  220],
  ANYTREK:         [139, 92,  246, 220],
  BLACKBERRY_LOG:  [16,  185, 129, 220],
  BLACKBERRY_TRAN: [59,  130, 246, 220],
  SAMSARA:         [6,   182, 212, 220],
}
const DEFAULT_COLOR: [number, number, number, number] = [156, 163, 175, 200]

const SOURCE_HEX: Record<string, string> = {
  FLEETLOCATE:     '#f59e0b',
  ANYTREK:         '#8b5cf6',
  BLACKBERRY_LOG:  '#10b981',
  BLACKBERRY_TRAN: '#3b82f6',
  SAMSARA:         '#06b6d4',
}

const INITIAL_VIEW_STATE = {
  longitude: -118.216,
  latitude: 33.770,
  zoom: 9.5,
  pitch: 30,
  bearing: 0,
}

type ViewState = typeof INITIAL_VIEW_STATE & {
  transitionDuration?: number
}

export default function ChassisTracker() {
  const { data: gpsData = [], isLoading, error, dataUpdatedAt } = useChassisGps()
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE)
  const [hoveredObject, setHoveredObject] = useState<ChassisGpsPoint | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [selectedChassis, setSelectedChassis] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(['FLEETLOCATE', 'ANYTREK', 'BLACKBERRY_LOG', 'BLACKBERRY_TRAN', 'SAMSARA'])
  )
  const [dormantThreshold, setDormantThreshold] = useState(0)
  const [zoom, setZoom] = useState(INITIAL_VIEW_STATE.zoom)

  const filteredData = useMemo(() => {
    return gpsData.filter(point => {
      if (!selectedSources.has(point.gps_source)) return false
      if (dormantThreshold > 0 && (point.dormant_days ?? 0) < dormantThreshold) return false
      if (searchQuery && !point.chassis_number.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [gpsData, selectedSources, dormantThreshold, searchQuery])

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    gpsData.forEach(p => {
      counts[p.gps_source] = (counts[p.gps_source] ?? 0) + 1
    })
    return counts
  }, [gpsData])

  const layers = useMemo(() => [
    new ScatterplotLayer<ChassisGpsPoint>({
      id: 'chassis-scatter',
      data: filteredData,
      getPosition: (d: ChassisGpsPoint) => [Number(d.longitude), Number(d.latitude)],
      getFillColor: (d: ChassisGpsPoint) => {
        if (selectedChassis && d.chassis_number === selectedChassis) {
          return [255, 255, 255, 255]
        }
        return SOURCE_COLORS[d.gps_source] ?? DEFAULT_COLOR
      },
      getRadius: (d: ChassisGpsPoint) => {
        if (selectedChassis && d.chassis_number === selectedChassis) return 600
        return 300
      },
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      pickable: true,
      opacity: 0.9,
      stroked: true,
      getLineColor: [255, 255, 255, 60],
      lineWidthMinPixels: 1,
      updateTriggers: {
        getFillColor: [selectedChassis],
        getRadius: [selectedChassis],
      },
      onHover: ({ object, x, y }) => {
        setHoveredObject((object as ChassisGpsPoint) ?? null)
        setHoverPos(object ? { x, y } : null)
      },
      onClick: ({ object }) => {
        const obj = object as ChassisGpsPoint | null
        if (obj) {
          setSelectedChassis(prev => prev === obj.chassis_number ? null : obj.chassis_number)
          setViewState(prev => ({
            ...prev,
            longitude: Number(obj.longitude),
            latitude: Number(obj.latitude),
            zoom: Math.max(prev.zoom, 12),
            transitionDuration: 800,
          }))
        }
      },
    }),
    ...(zoom > 12 ? [
      new TextLayer<ChassisGpsPoint>({
        id: 'chassis-labels',
        data: filteredData,
        getPosition: (d: ChassisGpsPoint) => [Number(d.longitude), Number(d.latitude)],
        getText: (d: ChassisGpsPoint) => d.chassis_number,
        getSize: 11,
        getColor: [255, 255, 255, 200],
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'bottom' as const,
        getPixelOffset: [0, -12],
        fontFamily: 'monospace',
      })
    ] : []),
  ], [filteredData, selectedChassis, zoom])

  const toggleSource = useCallback((source: string) => {
    setSelectedSources(prev => {
      const next = new Set(prev)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }, [])

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  const selectedPoint = selectedChassis
    ? gpsData.find(p => p.chassis_number === selectedChassis) ?? null
    : null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', position: 'relative' }}>
      <div style={{
        width: 280,
        background: '#0f172a',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        borderRight: '1px solid #1e293b',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Chassis Tracker
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1e293b', borderRadius: 8, padding: '6px 10px'
          }}>
            <span style={{
              fontSize: 24, fontWeight: 700,
              color: isLoading ? '#64748b' : '#f1f5f9'
            }}>
              {isLoading ? '—' : filteredData.length}
            </span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              of {gpsData.length} chassis
            </span>
          </div>
          {lastUpdated && (
            <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
              Updated {lastUpdated} · auto-refreshes every 5m
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: '0.05em' }}>
            SEARCH
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Chassis number..."
            style={{
              width: '100%', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, padding: '7px 10px', color: '#f1f5f9',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
            GPS SOURCE
          </div>
          {Object.entries(sourceCounts).map(([source, count]) => (
            <div
              key={source}
              onClick={() => toggleSource(source)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                background: selectedSources.has(source) ? '#1e293b' : 'transparent',
                opacity: selectedSources.has(source) ? 1 : 0.4,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: SOURCE_HEX[source] ?? '#6b7280', flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, flex: 1 }}>{source}</span>
              <span style={{
                fontSize: 11, background: '#334155', borderRadius: 4,
                padding: '2px 6px', color: '#94a3b8',
              }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
            DORMANT DAYS
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
            Show chassis dormant ≥
          </div>
          <input
            type="number"
            value={dormantThreshold}
            onChange={e => setDormantThreshold(Number(e.target.value))}
            min={0}
            style={{
              width: '100%', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, padding: '7px 10px', color: '#f1f5f9',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
            {dormantThreshold === 0 ? '0 shows all' : `Showing dormant ≥ ${dormantThreshold} days`}
          </div>
        </div>

        {selectedPoint && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
              SELECTED
            </div>
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 12 }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                {selectedPoint.chassis_number}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                <div>{selectedPoint.lessor ?? 'Unknown Lessor'}</div>
                <div>{selectedPoint.landmark ?? selectedPoint.address ?? 'Location unknown'}</div>
                {selectedPoint.dormant_days != null && (
                  <div style={{ color: selectedPoint.dormant_days > 7 ? '#f59e0b' : '#10b981' }}>
                    {selectedPoint.dormant_days}d dormant
                  </div>
                )}
                {selectedPoint.lease_rate_per_day != null && (
                  <div>${Number(selectedPoint.lease_rate_per_day).toFixed(2)}/day</div>
                )}
              </div>
              <button
                onClick={() => setSelectedChassis(null)}
                style={{
                  marginTop: 8, fontSize: 11, color: '#64748b',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '12px 16px', marginTop: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, letterSpacing: '0.05em' }}>
            LEGEND
          </div>
          {Object.entries(SOURCE_HEX).map(([source, color]) => (
            <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{source}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>SELECTED</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15,23,42,0.9)', color: '#f1f5f9', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, zIndex: 20,
          }}>
            Loading GPS data...
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, zIndex: 20,
          }}>
            Error loading GPS data
          </div>
        )}

        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => {
            const next = vs as ViewState
            setViewState(next)
            setZoom(next.zoom ?? zoom)
          }}
          controller={true}
          layers={layers}
          style={{ position: 'absolute', inset: '0' }}
        >
          <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            reuseMaps
          >
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-right" />
            <FullscreenControl position="top-right" />
          </Map>
        </DeckGL>

        {hoveredObject && hoverPos && (
          <div style={{
            position: 'absolute',
            left: hoverPos.x + 12,
            top: hoverPos.y - 10,
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#f1f5f9',
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 30,
            maxWidth: 280,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              {hoveredObject.chassis_number}
            </div>
            <div style={{
              display: 'inline-block',
              background: SOURCE_HEX[hoveredObject.gps_source]
                ? SOURCE_HEX[hoveredObject.gps_source] + '33' : '#33415533',
              color: SOURCE_HEX[hoveredObject.gps_source] ?? '#94a3b8',
              borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              marginBottom: 8, border: `1px solid ${SOURCE_HEX[hoveredObject.gps_source] ?? '#334155'}44`,
            }}>
              {hoveredObject.gps_source}
            </div>
            <div style={{ display: 'grid', gap: 3, color: '#94a3b8', lineHeight: 1.5 }}>
              {hoveredObject.lessor && (
                <div><span style={{ color: '#64748b' }}>Lessor: </span>{hoveredObject.lessor}</div>
              )}
              {hoveredObject.reporting_category && (
                <div><span style={{ color: '#64748b' }}>Category: </span>{hoveredObject.reporting_category}</div>
              )}
              {(hoveredObject.landmark || hoveredObject.address) && (
                <div style={{ marginTop: 2 }}>
                  {hoveredObject.landmark && <div style={{ color: '#f1f5f9', fontSize: 11 }}>{hoveredObject.landmark}</div>}
                  {hoveredObject.address && <div style={{ fontSize: 10, color: '#64748b' }}>{hoveredObject.address}</div>}
                </div>
              )}
              {hoveredObject.gps_date && (
                <div style={{ marginTop: 2 }}>
                  <span style={{ color: '#64748b' }}>Last ping: </span>
                  {new Date(hoveredObject.gps_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
              {hoveredObject.dormant_days != null && (
                <div style={{ color: hoveredObject.dormant_days > 7 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                  {hoveredObject.dormant_days} days dormant
                  {hoveredObject.dormant_days > 7 ? ' ⚠' : ' ✓'}
                </div>
              )}
              {hoveredObject.lease_rate_per_day != null && (
                <div>
                  <span style={{ color: '#64748b' }}>Rate: </span>
                  ${Number(hoveredObject.lease_rate_per_day).toFixed(2)}/day
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 40, left: 16,
          background: 'rgba(15,23,42,0.85)', borderRadius: 8, padding: '8px 12px',
          backdropFilter: 'blur(8px)', border: '1px solid #1e293b',
        }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
            <span><span style={{ color: '#f1f5f9', fontWeight: 600 }}>{filteredData.length}</span> showing</span>
            <span><span style={{ color: '#f59e0b', fontWeight: 600 }}>
              {filteredData.filter(p => (p.dormant_days ?? 0) > 7).length}
            </span> dormant &gt;7d</span>
            <span><span style={{ color: '#10b981', fontWeight: 600 }}>
              {filteredData.filter(p => (p.dormant_days ?? 0) <= 7).length}
            </span> active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
