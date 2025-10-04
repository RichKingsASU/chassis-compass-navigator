import { createClient } from "npm:@supabase/supabase-js@^2";
import { env } from "./env.ts";

export const sbAdmin = () =>
  createClient(env.SUPABASE_URL, env.SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: "public" }, // use public by default
  });

/**
 * Tries to fetch the most recent (lat, lon) for an asset from a few places:
 *  1) latest_locations view with columns (asset_id, lat, lon)
 *  2) fallback: direct query to asset_locations via a view that exposes lat/lon
 *
 * Returns null if nothing usable is found.
 */
export async function fetchLatestLatLon(
  asset_id: string,
): Promise<{ lat: number; lon: number } | null> {
  const sb = sbAdmin();

  // 1) Try latest_locations view
  {
    const { data, error } = await sb
      .from("latest_locations")
      .select("lat,lon")
      .eq("asset_id", asset_id)
      .maybeSingle();

    if (!error && data && typeof data.lat === "number" && typeof data.lon === "number") {
      return { lat: data.lat, lon: data.lon };
    }
  }

  // 2) Fallback: try a view exposing lat/lon as columns
  {
    const { data, error } = await sb
      .from("asset_locations_latest") // optional view name—ignore if you don't have it
      .select("lat,lon")
      .eq("asset_id", asset_id)
      .maybeSingle();

    if (!error && data && typeof data.lat === "number" && typeof data.lon === "number") {
      return { lat: data.lat, lon: data.lon };
    }
  }

  return null;
}

/** Straight-line distance (meters) using Haversine formula */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // m
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function ensureOrg(id: string, name: string): Promise<void> {
  const sb = sbAdmin();
  const { error } = await sb.from("orgs").upsert({ id, name });
  if (error) console.error(`ensureOrg failed: ${error.message}`);
}

export async function ensureAsset(
  p: { org_id: string; radar_asset_uuid: string | null; identifier: string | null },
): Promise<string> {
  const sb = sbAdmin();
  const { data, error } = await sb.from("assets").select("id").eq("org_id", p.org_id).or(
    `radar_asset_uuid.eq.${p.radar_asset_uuid},identifier.eq.${p.identifier}`,
  ).maybeSingle();
  if (error) throw error;
  if (data?.id) return data.id;

  const { data: newAsset, error: newAssetError } = await sb.from("assets").insert({
    org_id: p.org_id,
    radar_asset_uuid: p.radar_asset_uuid,
    identifier: p.identifier,
  }).select("id").single();
  if (newAssetError) throw newAssetError;
  return newAsset.id;
}

export async function insertAssetLocation(p: {
  org_id: string;
  asset_id: string;
  recorded_at: string;
  lon: number;
  lat: number;
  normalized_address: string | null;
  place_id: string | null;
  raw: unknown;
}): Promise<void> {
  const sb = sbAdmin();
  const { error } = await sb.from("asset_locations").insert(p);
  if (error) console.error(`insertAssetLocation failed: ${error.message}`);
}