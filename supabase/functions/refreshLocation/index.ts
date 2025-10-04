import { env } from "../_shared/env.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { reverseGeocode } from "../_shared/geocode.ts";
import { ensureAsset, insertAssetLocation, ensureOrg } from "../_shared/db.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    await ensureOrg(env.PROJECT_ORG_ID, "My Test Org");

    const r = await bbFetch("/assets/data", { method: "GET" });
    if (!r.ok) return new Response(JSON.stringify({ error: `BB /assets/data ${r.status}` }), { status: 502, headers: { "content-type": "application/json", ...cors } });
    const data = await r.json() as any;
    if (!data.items?.length) return new Response(JSON.stringify({ updated: 0 }), { headers: { "content-type": "application/json", ...cors } });

    let inserted = 0;
    for (const it of data.items) {
      if (it.id !== "asset.sensor") continue;
      const v = it.values ?? {}; const g = v.geo_location; if (!g?.lat || !g?.lon) continue;

      const assetId = await ensureAsset({
        org_id: env.PROJECT_ORG_ID,
        radar_asset_uuid: it.device_id ?? null,
        identifier: v.asset?.params?.identifier ?? v.identifier ?? null
      });

      const norm = await reverseGeocode(g.lat, g.lon);
      await insertAssetLocation({
        org_id: env.PROJECT_ORG_ID,
        asset_id: assetId,
        recorded_at: new Date(it.recorded_on).toISOString(),
        lon: g.lon, lat: g.lat,
        normalized_address: norm.address, place_id: norm.place_id,
        raw: it
      });
      inserted++;
    }

    const tokens = (data.token ?? []).filter(Boolean);
    if (tokens.length) await bbFetch("/assets/data/token", { method: "PUT", body: JSON.stringify({ token: tokens }) });

    return new Response(JSON.stringify({ updated: inserted }), { headers: { "content-type": "application/json", ...cors } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message ?? e) }), { status: 500, headers: { "content-type": "application/json", ...cors } });
  }
});