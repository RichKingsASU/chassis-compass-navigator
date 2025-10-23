import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";

interface MapSmokeProps {
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function MapSmoke({ center = { lat: 33.4484, lng: -112.0740 }, zoom = 7 }: MapSmokeProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    if (!apiKey) { 
      setErr("Missing VITE_GOOGLE_MAPS_API_KEY"); 
      return; 
    }
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!ref.current) return;
        const map = new google.maps.Map(ref.current, { 
          center, 
          zoom, 
          mapTypeControl: false 
        });
        new google.maps.Marker({ position: center, map });
      })
      .catch((e) => setErr(e?.message ?? "Failed to load Google Maps"));
  }, [apiKey, center.lat, center.lng, zoom]);

  if (err) return <div className="text-destructive text-sm p-4 border border-destructive/20 rounded-md bg-destructive/10">{err}</div>;
  return <div ref={ref} className="w-full h-80 rounded-md border" />;
}
