import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';

interface LocationHistory {
  id: number;
  recorded_at: string;
  location: {
    coordinates: [number, number];
  };
}

interface ChassisMapViewProps {
  apiKey: string;
  locationHistory: LocationHistory[];
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

export const ChassisMapView = ({ apiKey, locationHistory }: ChassisMapViewProps) => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const coordinates = locationHistory
    .filter(loc => loc.location?.coordinates)
    .map(loc => ({
      lat: loc.location.coordinates[1],
      lng: loc.location.coordinates[0],
      time: loc.recorded_at
    }));

  const center = coordinates.length > 0
    ? coordinates[coordinates.length - 1]
    : { lat: 33.7701, lng: -118.1937 };

  const pathCoordinates = coordinates.map(coord => ({
    lat: coord.lat,
    lng: coord.lng
  }));

  if (!isLoaded || coordinates.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">
          {!isLoaded ? 'Loading map...' : 'No GPS data available'}
        </p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      options={{
        styles: [
          // Industry-optimized map style for logistics
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#dadada" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }],
          },
        ],
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Route polyline */}
      {pathCoordinates.length > 1 && (
        <Polyline
          path={pathCoordinates}
          options={{
            strokeColor: '#2563eb',
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }}
        />
      )}

      {/* Location markers */}
      {coordinates.map((coord, index) => (
        <Marker
          key={index}
          position={{ lat: coord.lat, lng: coord.lng }}
          onClick={() => setSelectedMarker(index)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: index === coordinates.length - 1 ? '#16a34a' : '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: index === coordinates.length - 1 ? 8 : 6,
          }}
          title={new Date(coord.time).toLocaleString()}
        />
      ))}
    </GoogleMap>
  );
};
