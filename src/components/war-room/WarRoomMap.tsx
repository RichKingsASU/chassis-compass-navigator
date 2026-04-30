import { useMemo, useCallback, useState } from 'react';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { WarRoomChassis } from '@/types/warroom';
import { STATUS_COLORS } from '@/types/warroom';

interface Props {
  data: WarRoomChassis[];
  onSelectChassis: (chassis: WarRoomChassis) => void;
}

const INITIAL_VIEW = {
  longitude: -118.2,
  latitude: 33.78,
  zoom: 9.5,
  pitch: 0,
  bearing: 0,
};

export function WarRoomMap({ data, onSelectChassis }: Props) {
  const [viewState, setViewState] = useState(INITIAL_VIEW);
  const [cursor, setCursor] = useState<string>('default');

  const layers = useMemo(() => [
    new ScatterplotLayer<WarRoomChassis>({
      id: 'chassis-points',
      data,
      pickable: true,
      opacity: 0.9,
      stroked: true,
      filled: true,
      radiusMinPixels: 5,
      radiusMaxPixels: 18,
      radiusScale: 1,
      lineWidthMinPixels: 1,
      getPosition: (d) => [d.longitude, d.latitude],
      getFillColor: (d) =>
        d.war_room_status ? STATUS_COLORS[d.war_room_status] : [148, 163, 184, 180],
      getLineColor: [255, 255, 255, 120],
      getRadius: (d) => {
        if (d.war_room_status === 'dormant_high') return 14;
        if (d.war_room_status === 'dormant_low') return 10;
        return 7;
      },
      onHover: ({ object }) => { setCursor(object ? 'pointer' : 'default'); },
      onClick: ({ object }) => { if (object) onSelectChassis(object); },
      updateTriggers: { getFillColor: data, getRadius: data },
    }),
  ], [data, onSelectChassis]);

  const getTooltip = useCallback(({ object }: { object?: WarRoomChassis | null }) => {
    if (!object) return null;
    return {
      html: `<div style="font-family:sans-serif;font-size:12px;line-height:1.6;max-width:220px">
        <strong>${object.chassis_number ?? object.location_name}</strong><br/>
        ${object.location_name}<br/>
        ${object.city ? `${object.city}, ${object.state ?? ''}` : ''}
        ${object.dormant_days != null ? `<br/>Dormant: <strong>${object.dormant_days}d</strong>` : ''}
        ${object.cust_rate_charge ? `<br/>Rate: $${object.cust_rate_charge.toLocaleString()}` : ''}
      </div>`,
      style: {
        background: 'white', color: '#111', padding: '8px 10px',
        borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
      },
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs as typeof INITIAL_VIEW)}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
        style={{ position: 'relative', width: '100%', height: '100%' }}
        getCursor={() => cursor}
      >
        <Map
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN as string}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          attributionControl={false}
        />
      </DeckGL>
      <div className="absolute bottom-6 left-4 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-xs space-y-1.5 shadow-sm">
        {([['bg-green-500','Active'],['bg-amber-400','Dormant < 3d'],['bg-red-500','Dormant 3d+'],['bg-blue-500','In Transit'],['bg-slate-400','Returned']] as const).map(([color,label]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border border-border/50 rounded px-2 py-1 text-xs text-muted-foreground">
        {data.length.toLocaleString()} locations
      </div>
    </div>
  );
}
