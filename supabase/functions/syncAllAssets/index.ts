import { env } from "../_shared/env.ts";
import { bbFetch, toIso } from "../_shared/blackberry.ts";
import { reverseGeocode } from "../_shared/geocode.ts";
import { ensureAsset, insertAssetLocation } from "../_shared/db.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function isCronAllowed(req: Request) {
  const h = req.headers.get("x-cron-secret") ?? "";
  return env.CRON_SHARED_SECRET && h === env.CRON_SHARED_SECRET;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    if (!isCronAllowed(req)) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    // one bounded drain pass (increase loops later)
    const r = await bbFetch("/assets/data", { method: "GET" });
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `BB /assets/data ${r.status}` }), {
        status: 502,
        headers: { "content-type": "application/json", ...cors },
      });
    }
    const data = await r.json() as { items: any[]; token: any[] };
    if (!data.items?.length) {
      return new Response(JSON.stringify({ drained: true }), {
        headers: { "content-type": "application/json", ...cors },
      });
    }

    for (const it of data.items) {
      if (it.id !== "asset.sensor") continue;
      const v = it.values ?? {};
      const g = v.geo_location;
      if (!g?.lat || !g?.lon) continue;

      const assetId = await ensureAsset({
        org_id: env.PROJECT_ORG_ID,
        radar_asset_uuid: it.device_id ?? null,
        identifier: v.asset?.params?.identifier ?? v.identifier ?? null,
      });

      const norm = await reverseGeocode(g.lat, g.lon);
      await insertAssetLocation({
        org_id: env.PROJECT_ORG_ID,
        asset_id: assetId,
        recorded_at: toIso(it.recorded_on) ?? new Date().toISOString(),
        lon: g.lon,
        lat: g.lat,
        normalized_address: norm.address,
        place_id: norm.place_id,
        raw: it,
      });
    }

    // ACK tokens
    const tokens = (data.token ?? []).filter(Boolean);
    if (tokens.length) {
      await bbFetch("/assets/data/token", {
        method: "PUT",
        body: JSON.stringify({ token: tokens }),
      });
    }

    return new Response(JSON.stringify({ ok: true, ingested: data.items.length }), {
      headers: { "content-type": "application/json", ...cors },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors },
    });
  }
});
