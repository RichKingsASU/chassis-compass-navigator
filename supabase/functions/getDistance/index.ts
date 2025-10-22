import { env } from "../_shared/env.ts";
import { sbAdmin } from "../_shared/db.ts";
import { ok, bad } from "../_shared/http.ts";

Deno.serve(async (req) => {
  try {
    const { asset_id, toLat, toLon } = await req.json();
    if (!asset_id || typeof toLat !== "number" || typeof toLon !== "number") {
      return bad("asset_id, toLat, toLon required");
    }

    // Get last known coords from view
    const sb = sbAdmin();
    const { data, error } = await sb.from("fleet.assets_for_map")
      .select("lat,lon")
      .eq("id", asset_id)
      .maybeSingle();
    if (error) return bad(error.message, 500);
    if (!data) return bad("asset not found or no last location", 404);

    const u = new URL("https://maps.googleapis.com/maps/api/directions/json");
    u.searchParams.set("origin", `${data.lat},${data.lon}`);
    u.searchParams.set("destination", `${toLat},${toLon}`);
    u.searchParams.set("mode", "driving");
    u.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);

    const r = await fetch(u);
    if (!r.ok) return bad(`Google Directions ${r.status}`, 502);
    const j = await r.json();
    const leg = j.routes?.[0]?.legs?.[0];
    const out = {
      distance_m: leg?.distance?.value ?? null,
      duration_s: leg?.duration?.value ?? null,
      summary: j.routes?.[0]?.summary ?? null,
      polyline: j.routes?.[0]?.overview_polyline?.points ?? null
    };
    return ok(out);
  } catch (e) {
    return bad(`distance error: ${e.message}`, 500);
  }
});