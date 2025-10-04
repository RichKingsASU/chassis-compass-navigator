// Edge function: getDistance
// POST body accepts either:
//   { asset_id: string, toLat: number, toLon: number }
// or
//   { identifier: string, toLat: number, toLon: number }
// Response:
//   { origin:{lat,lon}, destination:{lat,lon}, straight_line_meters, driving?:{distance_meters,duration_seconds} }

import { fetchLatestLatLon, haversineMeters, sbAdmin } from "../_shared/db.ts";
import { env } from "../_shared/env.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", ...cors },
    ...init,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    const sb = sbAdmin();

    // ✱ FIX: accept identifier OR asset_id; validate properly
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const aId = body.asset_id as string | undefined;
    const identifier = body.identifier as string | undefined;
    const toLat = body.toLat as number;
    const toLon = body.toLon as number;

    if ((!aId && !identifier) || typeof toLat !== "number" || typeof toLon !== "number") {
      return json({ error: "asset_id (or identifier), toLat, toLon required" }, { status: 400 });
    }

    // ✱ FIX: if identifier provided, resolve it to asset_id
    let asset_id = aId;
    if (!asset_id && identifier) {
      const { data, error } = await sb
        .from("assets")
        .select("id")
        .eq("identifier", identifier)
        .maybeSingle();

      if (error) return json({ error: error.message }, { status: 500 });
      if (!data?.id) {
        return json({ error: `asset with identifier \"${identifier}\" not found` }, {
          status: 404,
        });
      }
      asset_id = data.id as string;
    }

    const latest = await fetchLatestLatLon(asset_id);
    if (!latest) {
      return json({ error: "no last location" }, { status: 404 });
    }

    const dest = { lat: toLat, lon: toLon };
    const straight = haversineMeters(latest.lat, latest.lon, dest.lat, dest.lon);

    // Optional driving distance via Google Maps (if key present)
    const driving = await googleDriving({ lat: latest.lat, lon: latest.lon }, dest);

    return json({
      origin: latest,
      destination: dest,
      straight_line_meters: Math.round(straight),
      driving: driving ?? null,
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, { status: 500 });
  }
});

async function googleDriving(
  origin: { lat: number; lon: number },
  dest: { lat: number; lon: number },
): Promise<{ distance_meters: number; duration_seconds: number } | null> {
  if (!env.GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lon}`,
    destinations: `${dest.lat},${dest.lon}`,
    units: "metric",
    mode: "driving",
    key: env.GOOGLE_MAPS_API_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) return null;

  const payload = await r.json();
  const element = payload?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;

  return {
    distance_meters: element.distance.value,
    duration_seconds: element.duration.value,
  };
}
