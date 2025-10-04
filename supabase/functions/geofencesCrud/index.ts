import { sbAdmin } from "../_shared/db.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { env } from "../_shared/env.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

type GeofenceBody = {
  name?: string;
  description?: string | null;
  dwell_report?: boolean;
  detention_report?: boolean;
  yard_report?: boolean;
  colour?: string | null;
  polygon?: unknown; // allow pass-through of GeoJSON
  radar_geofence_id?: string;
  geofence_id?: string;
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const sb = sbAdmin();

    if (req.method === "POST") {
      const body = (await req.json()) as GeofenceBody;

      const r = await bbFetch("/geofences", {
        method: "POST",
        body: JSON.stringify({
          name: body.name,
          description: body.description ?? undefined,
          dwell_report: body.dwell_report ?? true,
          detention_report: body.detention_report ?? true,
          yard_report: body.yard_report ?? true,
          colour: body.colour ?? undefined,
          polygon: body.polygon,
        }),
      });

      if (!r.ok) {
        return new Response(
          JSON.stringify({
            error: `Radar geofence create failed: ${r.status}`,
            detail: await r.text(),
          }),
          { status: 502, headers: { "content-type": "application/json", ...cors } },
        );
      }

      const g = await r.json();
      const { data, error } = await sb
        .from("geofences")
        .insert({
          org_id: env.PROJECT_ORG_ID,
          radar_geofence_id: g.id,
          name: g.name,
          // If your table has geometry/json columns, add them here
        })
        .select("*")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ geofence: data }), {
        headers: { "content-type": "application/json", ...cors },
      });
    }

    if (req.method === "DELETE") {
      const body = (await req.json()) as GeofenceBody;
      const id = body.radar_geofence_id ?? body.geofence_id;
      if (!id) {
        return new Response(JSON.stringify({ error: "radar_geofence_id is required" }), {
          status: 400,
          headers: { "content-type": "application/json", ...cors },
        });
      }

      const r = await bbFetch(`/geofences/${id}`, { method: "DELETE" });
      if (r.status !== 204) {
        return new Response(
          JSON.stringify({
            error: `Radar geofence delete failed: ${r.status}`,
            detail: await r.text(),
          }),
          { status: 502, headers: { "content-type": "application/json", ...cors } },
        );
      }

      await sb.from("fleet.geofences")
        .delete()
        .eq("org_id", env.PROJECT_ORG_ID)
        .eq("radar_geofence_id", id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json", ...cors },
      });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json", ...cors },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...cors },
    });
  }
});
