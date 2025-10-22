import { env } from "./env.ts";
export async function reverseGeocode(lat: number, lon: number) {
  const u = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  u.searchParams.set("latlng", `${lat},${lon}`);
  if (!env.GOOGLE_MAPS_API_KEY) return { address: null, place_id: null };
  u.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
  const r = await fetch(u);
  if (!r.ok) return { address: null as string | null, place_id: null as string | null };
  const j = r.json();
  const g = j.results?.[0];
  return { address: g?.formatted_address ?? null, place_id: g?.place_id ?? null };
}