import { env } from "../_shared/env.ts";
import { bbFetch, toIso } from "../_shared/blackberry.ts";
import { reverseGeocode } from "../_shared/geocode.ts";
import { ensureAsset, insertAssetLocation } from "../_shared/db.ts";
import { ok, bad, requireSecret } from "../_shared/http.ts";
import { sleep } from "../_shared/util.ts";

Deno.serve(async (req) => {
  try {
    // Protect: only cron/authorized callers
    await requireSecret(req, env.CRON_SHARED_SECRET);

    // Drain stream in a bounded loop to avoid runaway
    for (let i = 0; i < 20; i++) {
      const r = await bbFetch("/assets/data", { method: "GET" });
      if (r.status === 429) {
        const retry = parseInt(r.headers.get("Retry-After") ?? "5", 10);
        await sleep(retry * 1000);
        continue;
      }
      if (!r.ok) return bad(`BB /assets/data ${r.status} ${await r.text()}`, 502);

      const data = await r.json() as {
        total: number;
        token: (string | null)[];
        items: any[];
      };

      if (!data.items || data.items.length === 0) {
        // nothing to process; stop
        return ok({ drained: true });
      }

      // Process items
      for (const it of data.items) {
        const kind = it.id; // "asset.sensor" | "asset.event"
        const recordedAt = toIso(it.recorded_on) ?? new Date().toISOString();
        const vals = it.values ?? {};
        const geo = vals.geo_location;
        const identifier = vals.asset?.params?.identifier ?? vals.identifier ?? null;

        const assetId = await ensureAsset({
          org_id: env.PROJECT_ORG_ID,
          radar_asset_uuid: it.device_id ?? null,
          identifier
        });

        if (kind === "asset.sensor" && geo?.lat != null && geo?.lon != null) {
          // Reverse geocode throttle: you can add a sampling strategy here if needed
          const norm = await reverseGeocode(geo.lat, geo.lon);

          await insertAssetLocation({
            org_id: env.PROJECT_ORG_ID,
            asset_id: assetId,
            recorded_at: recordedAt,
            lon: geo.lon,
            lat: geo.lat,
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
        }

        if (kind === "asset.event") {
          // Optional: insert into fleet.asset_events (left out here for brevity)
          // You can expand with geofence mapping if you mirror geofences locally.
        }
      }

      // ACK tokens if present
      const tokens = (data.token ?? []).filter(Boolean) as string[];
      if (tokens.length) {
        const ack = await bbFetch("/assets/data/token", {
          method: "PUT",
          body: JSON.stringify({ token: tokens })
        });
        if (ack.status !== 204) {
          return bad(`ACK failed ${ack.status} ${await ack.text()}`, 502);
        }
      }

      // Respect pacing
      const wait = parseInt(r.headers.get("X-RateLimit-Reset") ?? "5", 10);
      await sleep(wait * 1000);
    }

    return ok({ drained: false, note: "max iterations hit; will continue next run" });
  } catch (e) {
    if (e.message === "forbidden") return bad("forbidden", 403);
    return bad(`sync error: ${e.message}`, 500);
  }
});