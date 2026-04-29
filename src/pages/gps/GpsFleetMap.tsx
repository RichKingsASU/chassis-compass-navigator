/// <reference types="google.maps" />
import { Component, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Play, Pause, SkipBack } from 'lucide-react'
// @ts-ignore
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers'

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-destructive">Map failed to load</p>
            <p className="text-sm text-muted-foreground">{this.state.error}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

interface GpsPoint {
  gps_source: string
  chassis_number: string
  landmark: string | null
  address: string | null
  latitude: number
  longitude: number
  gps_date: string
  dormant_days: number | null
  gps_status: string | null
  lessor?: string | null
  mcl_region?: string | null
  lease_rate_per_day?: number | null
  chassis_type?: string | null
  mcl_status?: string | null
}

interface LandmarkPoint {
  name: string
  lat: number
  lon: number
  source: string
}

interface MgLocation {
  id: number
  name: string
  lat: number
  lon: number
  location_type: string
  city: string
  state: string
}

interface RoutePoint {
  chassis_number: string
  lat: number
  lon: number
  recorded_on: string
  velocity: number | null
  geofence_name: string | null
  container_mounted: boolean | null
  event_type: string | null
}

const CENTER = { lat: 33.8, lng: -118.2 }

function getChassisColor(d: GpsPoint): [number, number, number, number] {
  if (d.gps_status === 'Moving') return [16, 185, 129, 230]
  const days = Number(d.dormant_days) || 0
  if (days >= 30) return [239, 68, 68, 230]
  if (days >= 7)  return [245, 158, 11, 220]
  if (days >= 3)  return [251, 191, 36, 200]
  return [59, 130, 246, 200]
}

export default function GpsFleetMap() {
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [showMgLocations, setShowMgLocations] = useState(false)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState<GpsPoint | null>(null)
  const [routeData, setRouteData] = useState<RoutePoint[]>([])
  const [routeLoading, setRouteLoading] = useState(false)
  const [replayIndex, setReplayIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(true)
  const overlayRef = useRef<any>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    supabase.from('app_settings').select('value')
      .eq('key', 'google_maps_api_key').single()
      .then(({ data }) => {
        setApiKey((data as { value?: string } | null)?.value || null)
        setApiKeyLoading(false)
      })
  }, [])

  const { data: gpsPoints = [], isLoading: gpsLoading } = useQuery<GpsPoint[]>({
    queryKey: ['v_chassis_gps_mcl_map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_chassis_gps_mcl').select('*')
      if (error) throw error
      return ((data || []) as GpsPoint[]).filter(r => r.latitude && r.longitude)
    },
  })

  const { data: landmarks = [] } = useQuery<LandmarkPoint[]>({
    queryKey: ['landmark_coords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landmark_coords').select('name, lat, lon, source')
      if (error) throw error
      return (data || []) as LandmarkPoint[]
    },
  })

  const { data: mgLocations = [] } = useQuery<MgLocation[]>({
    queryKey: ['mg_locations_map'],
    enabled: showMgLocations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mg_locations')
        .select('id, name, lat, lon, location_type, city, state')
        .eq('active', true)
        .not('lat', 'is', null)
        .not('lon', 'is', null)
      if (error) throw error
      return (data || []) as MgLocation[]
    },
  })

  const loadRoute = useCallback(async (chassisNumber: string) => {
    setRouteLoading(true)
    setRouteData([])
    setReplayIndex(0)
    setIsPlaying(false)
    try {
      const { data, error } = await supabase
        .from('blackberry_log_gps')
        .select('chassis_number, lat, lon, recorded_on, velocity, geofence_name, container_mounted, event_type')
        .eq('chassis_number', chassisNumber)
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .order('recorded_on', { ascending: true })
        .limit(500)
      if (error) throw error
      setRouteData((data || []) as RoutePoint[])
    } finally {
      setRouteLoading(false)
    }
  }, [])

  const filteredPoints = useMemo(() =>
    sourceFilter === 'ALL'
      ? gpsPoints
      : gpsPoints.filter(p => p.gps_source === sourceFilter)
  , [gpsPoints, sourceFilter])

  const sourceCounts = useMemo(() => ({
    FLEETLOCATE: gpsPoints.filter(p => p.gps_source === 'FLEETLOCATE').length,
    BLACKBERRY_LOG: gpsPoints.filter(p => p.gps_source === 'BLACKBERRY_LOG').length,
    BLACKBERRY_TRAN: gpsPoints.filter(p => p.gps_source === 'BLACKBERRY_TRAN').length,
    ANYTREK: gpsPoints.filter(p => p.gps_source === 'ANYTREK').length,
  }), [gpsPoints])

  // Update deck.gl layers whenever data/filters change
  useEffect(() => {
    if (!overlayRef.current) return

    interface PathDatum { path: number[][] }

    const layers = [
      new ScatterplotLayer({
        id: 'chassis-positions',
        data: filteredPoints,
        getPosition: (d: GpsPoint) => [Number(d.longitude), Number(d.latitude)],
        getColor: (d: GpsPoint) => getChassisColor(d),
        getRadius: 7,
        radiusUnits: 'pixels',
        pickable: true,
        onClick: (info: any) => {
          const object = info?.object as GpsPoint | undefined
          if (object) {
            setSelectedPoint(object)
            loadRoute(object.chassis_number)
          }
        },
        updateTriggers: { getColor: [sourceFilter] },
      }),
      new ScatterplotLayer({
        id: 'landmarks',
        data: showLandmarks ? landmarks : [],
        getPosition: (d: LandmarkPoint) => [Number(d.lon), Number(d.lat)],
        getColor: [251, 146, 60, 240] as [number, number, number, number],
        getRadius: 10,
        radiusUnits: 'pixels',
        pickable: true,
      }),
      new ScatterplotLayer({
        id: 'mg-locations',
        data: showMgLocations ? mgLocations : [],
        getPosition: (d: MgLocation) => [Number(d.lon), Number(d.lat)],
        getColor: [148, 163, 184, 180] as [number, number, number, number],
        getRadius: 5,
        radiusUnits: 'pixels',
        pickable: true,
      }),
      new PathLayer({
        id: 'route-path',
        data: routeData.length > 0 ? [{
          path: routeData.map((p: RoutePoint) => [p.lon, p.lat]),
        }] : [],
        getPath: ((d: any) => (d as PathDatum).path) as any,
        getColor: [99, 102, 241] as [number, number, number],
        getWidth: 3,
        widthUnits: 'pixels',
      }),
    ]

    const currentPt = routeData[replayIndex]
    if (currentPt) {
      layers.push(
        new ScatterplotLayer({
          id: 'replay-dot',
          data: [currentPt],
          getPosition: (d: RoutePoint) => [d.lon, d.lat],
          getColor: [239, 68, 68] as [number, number, number],
          getRadius: 12,
          radiusUnits: 'pixels',
        }) as any
      )
    }

    overlayRef.current.setProps({ layers })
  }, [filteredPoints, landmarks, mgLocations, sourceFilter,
      showLandmarks, showMgLocations, routeData, replayIndex, loadRoute])

  // Replay playback
  useEffect(() => {
    if (!isPlaying || routeData.length === 0) return
    const interval = setInterval(() => {
      setReplayIndex(i => {
        if (i >= routeData.length - 1) {
          setIsPlaying(false)
          return i
        }
        return i + 1
      })
    }, 200)
    return () => clearInterval(interval)
  }, [isPlaying, routeData.length])

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  })

  const onMapLoad = useCallback(async (map: google.maps.Map) => {
    mapRef.current = map
    const { GoogleMapsOverlay } = await import('@deck.gl/google-maps')
    overlayRef.current = new GoogleMapsOverlay({ layers: [] })
    overlayRef.current.setMap(map)
  }, [])

  if (apiKeyLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <p className="text-muted-foreground">Loading map configuration...</p>
      </div>
    )
  }

  if (!apiKeyLoading && !apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-5xl">🗺️</div>
        <h2 className="text-xl font-semibold">Google Maps API Key Required</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          Add your Google Maps API key to Supabase app_settings
          with key 'google_maps_api_key', then refresh this page.
        </p>
        <a href="/settings" className="text-primary underline text-sm">
          Go to Settings →
        </a>
      </div>
    )
  }

  return (
    <MapErrorBoundary>
    <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background gap-4 flex-wrap">
        <div>
          <span className="font-semibold text-sm">GPS Fleet Map</span>
          <span className="text-xs text-muted-foreground ml-2">
            {filteredPoints.length} chassis · {landmarks.length} landmarks
          </span>
        </div>

        <Tabs value={sourceFilter} onValueChange={setSourceFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="ALL" className="text-xs">All ({gpsPoints.length})</TabsTrigger>
            <TabsTrigger value="FLEETLOCATE" className="text-xs">FleetLocate ({sourceCounts.FLEETLOCATE})</TabsTrigger>
            <TabsTrigger value="BLACKBERRY_LOG" className="text-xs">BB Log ({sourceCounts.BLACKBERRY_LOG})</TabsTrigger>
            <TabsTrigger value="BLACKBERRY_TRAN" className="text-xs">BB Tran ({sourceCounts.BLACKBERRY_TRAN})</TabsTrigger>
            <TabsTrigger value="ANYTREK" className="text-xs">Anytrek ({sourceCounts.ANYTREK})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={showLandmarks ? 'default' : 'outline'}
            size="sm" className="text-xs h-8"
            onClick={() => setShowLandmarks(p => !p)}>
            🏢 Landmarks
          </Button>
          <Button
            variant={showMgLocations ? 'default' : 'outline'}
            size="sm" className="text-xs h-8"
            onClick={() => setShowMgLocations(p => !p)}>
            📍 MG Locations
          </Button>
        </div>
      </div>

      {/* Map + side panel row */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {loadError ? (
            <div className="h-full flex items-center justify-center bg-red-50">
              <p className="text-sm text-red-600">Map failed to load: {loadError.message}</p>
            </div>
          ) : !isLoaded ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={CENTER}
              zoom={9}
              onLoad={onMapLoad}
              options={{
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
              }}
            />
          )}

          {/* Legend */}
          <div className="absolute bottom-8 left-4 bg-background/95 rounded-lg p-3 text-xs shadow-lg z-10 space-y-1.5">
            <p className="font-semibold mb-2">Chassis Status</p>
            {([
              ['#10b981', 'Moving'],
              ['#3b82f6', 'Active (<3d)'],
              ['#fbbf24', 'Idle (3-7d)'],
              ['#f59e0b', 'Dormant (7-30d)'],
              ['#ef4444', 'Dormant (30d+)'],
            ] as [string, string][]).map(([color, label]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
            <div className="border-t pt-1.5 mt-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0 bg-orange-400" />
                Landmarks
              </div>
              {showMgLocations && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0 bg-slate-400" />
                  MG Locations
                </div>
              )}
            </div>
          </div>

          {gpsLoading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
              <p className="text-sm font-medium">Loading chassis positions...</p>
            </div>
          )}
        </div>

        {selectedPoint && (
          <div className="w-80 border-l bg-background flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <div>
                <p className="font-mono font-bold">{selectedPoint.chassis_number}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{selectedPoint.gps_source}</Badge>
                  {selectedPoint.lessor && (
                    <Badge variant="secondary" className="text-xs">{selectedPoint.lessor}</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => { setSelectedPoint(null); setRouteData([]); setIsPlaying(false) }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b flex-shrink-0 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {([
                ['Landmark', selectedPoint.landmark],
                ['Status', selectedPoint.gps_status],
                ['Dormant Days', selectedPoint.dormant_days != null
                  ? `${Math.round(Number(selectedPoint.dormant_days))}d` : null],
                ['Last Ping', selectedPoint.gps_date
                  ? new Date(selectedPoint.gps_date).toLocaleDateString() : null],
                ['Chassis Type', selectedPoint.chassis_type],
                ['Region', selectedPoint.mcl_region],
                ['Daily Rate', selectedPoint.lease_rate_per_day
                  ? `$${Number(selectedPoint.lease_rate_per_day).toFixed(2)}/day` : null],
                ['Idle Cost', selectedPoint.lease_rate_per_day && selectedPoint.dormant_days
                  ? `$${(Number(selectedPoint.lease_rate_per_day) * Number(selectedPoint.dormant_days)).toFixed(2)}`
                  : null],
              ] as [string, string | null | undefined][]).map(([label, value]) => value ? (
                <div key={label}>
                  <p className="text-muted-foreground">{label}</p>
                  <p className="font-medium truncate">{value}</p>
                </div>
              ) : null)}
              <div className="col-span-2">
                <p className="text-muted-foreground">Coordinates</p>
                <p className="font-mono text-[10px]">
                  {Number(selectedPoint.latitude).toFixed(5)}, {Number(selectedPoint.longitude).toFixed(5)}
                </p>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-xs font-semibold mb-3 flex items-center gap-2">
                Route Replay
                <span className="text-muted-foreground font-normal">(BlackBerry history)</span>
              </p>

              {routeLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : routeData.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No BlackBerry history found for this chassis.
                  Route replay is only available for BlackBerry-tracked units.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {routeData.length} waypoints ·{' '}
                    {new Date(routeData[0].recorded_on).toLocaleDateString()} →{' '}
                    {new Date(routeData[routeData.length - 1].recorded_on).toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                      onClick={() => { setReplayIndex(0); setIsPlaying(false) }}>
                      <SkipBack className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                      onClick={() => setIsPlaying(p => !p)}>
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <div className="flex-1 bg-muted rounded-full h-1.5 cursor-pointer"
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const pct = (e.clientX - rect.left) / rect.width
                        setIsPlaying(false)
                        setReplayIndex(Math.floor(pct * routeData.length))
                      }}>
                      <div className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(replayIndex / Math.max(routeData.length - 1, 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">
                      {replayIndex + 1}/{routeData.length}
                    </span>
                  </div>

                  {routeData[replayIndex] && (
                    <div className="text-xs space-y-1 p-2 bg-muted rounded-md">
                      <p className="font-medium">
                        {new Date(routeData[replayIndex].recorded_on).toLocaleString()}
                      </p>
                      <p>{routeData[replayIndex].geofence_name || 'In transit'}</p>
                      {routeData[replayIndex].velocity != null && (
                        <p>Speed: {Number(routeData[replayIndex].velocity).toFixed(1)} mph</p>
                      )}
                      <p>Container: {routeData[replayIndex].container_mounted ? '✓ Mounted' : '○ Empty'}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {Number(routeData[replayIndex].lat).toFixed(5)}, {Number(routeData[replayIndex].lon).toFixed(5)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </MapErrorBoundary>
  )
}
