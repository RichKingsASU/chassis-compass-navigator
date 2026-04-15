import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import { supabase } from '@/lib/supabase'

interface ChassisLocation {
  id: string
  chassis_number: string
  latitude: number
  longitude: number
  location_name: string
  provider: string
  gps_provider: string
  timestamp: string
  status: string
}

interface GoogleMapsFleetMapProps {
  locations: ChassisLocation[]
}

const containerStyle = { width: '100%', height: '100%' }

const defaultCenter = { lat: 33.0, lng: -80.0 } // Southeast US default

export default function GoogleMapsFleetMap({ locations }: GoogleMapsFleetMapProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<ChassisLocation | null>(null)

  useEffect(() => {
    async function fetchKey() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'google_maps_api_key')
          .single()
        setApiKey(data?.value || null)
        console.log('Maps API key loaded:', data?.value ? `${data.value.slice(0, 8)}...` : 'NOT FOUND')
      } catch {
        setApiKey(null)
      } finally {
        setLoadingKey(false)
      }
    }
    fetchKey()
  }, [])

  if (loadingKey) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
        <p className="text-muted-foreground">Loading map configuration...</p>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
        <div className="text-center space-y-2">
          <div className="text-5xl">🗺️</div>
          <p className="text-lg font-medium text-muted-foreground">Fleet Map</p>
          <p className="text-sm text-muted-foreground">
            No Google Maps API key configured. Add one in{' '}
            <a href="/settings" className="text-teal-600 underline hover:text-teal-700">Settings → Integrations</a>.
          </p>
        </div>
      </div>
    )
  }

  const validLocations = locations.filter(l => l.latitude && l.longitude)

  if (validLocations.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
        <div className="text-center space-y-2">
          <div className="text-5xl">📍</div>
          <p className="text-lg font-medium text-muted-foreground">No GPS Data</p>
          <p className="text-sm text-muted-foreground">No chassis with valid coordinates found.</p>
        </div>
      </div>
    )
  }

  return (
    <MapInner
      apiKey={apiKey}
      locations={validLocations}
      selectedMarker={selectedMarker}
      setSelectedMarker={setSelectedMarker}
    />
  )
}

function MapInner({
  apiKey,
  locations,
  selectedMarker,
  setSelectedMarker,
}: {
  apiKey: string
  locations: ChassisLocation[]
  selectedMarker: ChassisLocation | null
  setSelectedMarker: (loc: ChassisLocation | null) => void
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (locations.length > 0) {
        const bounds = new google.maps.LatLngBounds()
        locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }))
        map.fitBounds(bounds, 50)
      }
    },
    [locations]
  )

  if (loadError) {
    console.error('Google Maps load error:', loadError)
    return (
      <div className="h-full bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
        <div className="text-center space-y-2 p-4">
          <p className="text-lg font-medium text-red-600">Map Failed to Load</p>
          <p className="text-sm text-red-500 font-mono">{loadError.message}</p>
          <p className="text-xs text-red-400">Check browser console for details. Common fixes: enable Maps JavaScript API in Google Cloud Console, add agents-institute.com to allowed referrers, ensure billing is enabled.</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-100 via-green-50 to-teal-100 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading Google Maps...</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={6}
      onLoad={onMapLoad}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={{ lat: loc.latitude, lng: loc.longitude }}
          title={loc.chassis_number}
          onClick={() => setSelectedMarker(loc)}
          icon={
            loc.status === 'moving'
              ? { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }
              : { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }
          }
        />
      ))}

      {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
              {selectedMarker.chassis_number}
            </p>
            <table style={{ fontSize: 12, lineHeight: '1.5' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#666', paddingRight: 8 }}>Location</td>
                  <td>{selectedMarker.location_name || 'Unknown'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingRight: 8 }}>Provider</td>
                  <td>{selectedMarker.provider || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingRight: 8 }}>GPS</td>
                  <td>{selectedMarker.gps_provider || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingRight: 8 }}>Status</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: selectedMarker.status === 'moving' ? '#d1fae5' : '#f3f4f6',
                        color: selectedMarker.status === 'moving' ? '#065f46' : '#374151',
                      }}
                    >
                      {selectedMarker.status || 'N/A'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#666', paddingRight: 8 }}>Coords</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {selectedMarker.latitude.toFixed(4)}, {selectedMarker.longitude.toFixed(4)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
