import { env } from "../_shared/env.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { sbAdmin } from "../_shared/db.ts";
import { ok, bad } from "../_shared/http.ts";

Deno.serve(async (req) => {
  try {
    const sb = sbAdmin();

    if (req.method === "POST") {
      const body = await req.json();
      // body supports GeoJSON Polygon example in your API spec
      const r = await bbFetch("/geofences", { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) return bad(`BB geofence create ${r.status} ${await r.text()}`, 502);
      const g = await r.json();

      // Mirror local
      // If body.polygon is GeoJSON, convert in SQL later or store raw + use a DB job to convert
      const { data, error } = await sb.from("fleet.geofences").insert({
        org_id: env.PROJECT_ORG_ID,
        radar_geofence_id: g.id ?? null,
        name: g.name,
        description: g.description ?? null,
        colour: g.colour ?? null,
        polygon: body.polygon ? null : null,   // OPTIONAL: populate via a db function (ST_GeomFromGeoJSON)
        center: null,
        radius_m: null,
        dwell_report: g.dwell_report ?? false,
        detention_report: g.detention_report ?? false,
        yard_report: g.yard_report ?? false
      }).select("*").single();
      if (error) return bad(error.message, 500);

      return ok({ geofence: data });
    }

    if (req.method === "DELETE") {
      const { radar_geofence_id } = await req.json() as { radar_geofence_id: string };
      if (!radar_geofence_id) return bad("radar_geofence_id required");

      const r = await bbFetch(`/geofences/${radar_geofence_id}`, { method: "DELETE" });
      if (r.status !== 204) return bad(`BB geofence delete ${r.status} ${await r.text()}`, 502);

      await sb.from("fleet.geofences")
        .delete()
        .eq("org_id", env.PROJECT_ORG_ID)
        .eq("radar_geofence_id", radar_geofence_id);

      return ok();
    }

    return bad("method not allowed", 405);
  } catch (e) {
    return bad(`geofencesCrud error: ${e.message}`, 500);
  }
});