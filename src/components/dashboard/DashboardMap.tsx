
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Circle } from 'lucide-react';

interface DashboardMapProps {
  fleetlocateData?: any[];
}

const DashboardMap: React.FC<DashboardMapProps> = ({ fleetlocateData = [] }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Count unique chassis locations
  const uniqueLocations = new Set(fleetlocateData.map(d => d.Location || 'Unknown')).size;
  const activeGPS = fleetlocateData.filter(d => d.Status?.toLowerCase() === 'moving' || d.status?.toLowerCase() === 'moving').length;
  
  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden rounded-md">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Fleetlocate GPS Data</div>
          <div className="text-xs text-muted-foreground">
            {fleetlocateData.length > 0 
              ? `Tracking ${fleetlocateData.length} chassis across ${uniqueLocations} locations`
              : 'No GPS data available'}
          </div>
        </div>
      </div>
      
      {/* Sample map - this is just for visual representation */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100,100 L700,100 L700,500 L100,500 Z"
          stroke="#1A2942"
          strokeWidth="2"
          fill="transparent"
        />
        <path
          d="M100,200 C200,150 300,250 400,200 C500,150 600,250 700,200"
          stroke="#1A2942"
          strokeWidth="2"
          fill="transparent"
        />
        <path
          d="M100,300 C200,350 300,250 400,300 C500,350 600,250 700,300"
          stroke="#1A2942"
          strokeWidth="2"
          fill="transparent"
        />
        <path
          d="M100,400 C200,450 300,350 400,400 C500,450 600,350 700,400"
          stroke="#1A2942"
          strokeWidth="2"
          fill="transparent"
        />
      </svg>
      
      {/* Sample location pins */}
      <div className="absolute top-[30%] left-[20%]">
        <div className="relative group">
          <div className="bg-secondary text-white p-2 rounded-full group-hover:scale-110 transition-transform">
            <MapPin size={16} />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            CMAU1234567 - Samsara
          </div>
        </div>
      </div>
      
      <div className="absolute top-[45%] left-[35%]">
        <div className="relative group">
          <div className="bg-secondary text-white p-2 rounded-full group-hover:scale-110 transition-transform">
            <MapPin size={16} />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            TCLU7654321 - BlackBerry
          </div>
        </div>
      </div>
      
      {/* Cluster of pins */}
      <div className="absolute top-[55%] left-[60%]">
        <div className="relative group">
          <div className="bg-primary text-white p-2 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
            <span className="text-xs font-bold">12</span>
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            12 chassis in this area
          </div>
        </div>
      </div>
      
      {/* GPS signal animation */}
      <div className="absolute top-[25%] left-[70%]">
        <div className="relative group">
          <div className="bg-secondary text-white p-2 rounded-full animate-pulse-slow">
            <Circle size={16} />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            GPS signal active - Fleetview
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white p-2 rounded-md shadow-sm text-xs">
        <div className="font-medium mb-1">Fleetlocate Status</div>
        <div className="flex items-center gap-2">
          <div className="bg-secondary w-3 h-3 rounded-full"></div>
          <span>{fleetlocateData.length} Total Assets</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-primary w-3 h-3 rounded-full"></div>
          <span>{activeGPS} Active GPS</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardMap;
