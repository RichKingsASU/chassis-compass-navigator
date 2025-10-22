import { env } from "../_shared/env.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { reverseGeocode } from "../_shared/geocode.ts";
import { ensureAsset, insertAssetLocation } from "../_shared/db.ts";
import { ok, bad } from "../_shared/http.ts";

Deno.serve(async (_req) => {
  try {
    // Single pass to get a block (if any)
    const r = await bbFetch("/assets/data");
    if (!r.ok) return bad(`BB /assets/data ${r.status} ${await r.text()}`, 502);

    const data = await r.json() as { items: any[]; token: (string|null)[] };
    if (!data.items?.length) return ok({ updated: 0 });

    let inserted = 0;
    for (const it of data.items) {
      if (it.id !== "asset.sensor") continue;
      const vals = it.values ?? {};
      const geo = vals.geo_location;
      if (!geo?.lat || !geo?.lon) continue;

      const identifier = vals.asset?.params?.identifier ?? vals.identifier ?? null;
      const assetId = await ensureAsset({
        org_id: env.PROJECT_ORG_ID,
        radar_asset_uuid: it.device_id ?? null,
        identifier
      });

      const norm = await reverseGeocode(geo.lat, geo.lon);
      await insertAssetLocation({
        org_id: env.PROJECT_ORG_ID,
        asset_id: assetId,
        recorded_at: new Date(it.recorded_on).toISOString(),
        lon: geo.lon, lat: geo.lat,
        altitude_m: vals.altitude ?? null,
        velocity_cms: vals.velocity ?? null,
        hdop: vals.hdop ?? null,
        temperature_c: vals.temperature ?? null,
        humidity_pct: vals.humid ?? null,
        pressure_pa: vals.pressure ?? null,
        contents: vals.contents ?? null,
        contents_percentage: vals.contents_percentage ?? null,
        door_open: vals.door ?? null,
        normalized_address: norm.address,
        place_id: norm.place_id,
        raw: it
      });
      inserted++;
    }

    // ACK
    const tokens = (data.token ?? []).filter(Boolean) as string[];
    if (tokens.length) {
      await bbFetch("/assets/data/token", { method: "PUT", body: JSON.stringify({ token: tokens }) });
    }

    return ok({ updated: inserted });
  } catch (e) {
    return bad(`refresh error: ${e.message}`, 500);
  }
});