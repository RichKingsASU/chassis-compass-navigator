import { env } from "../_shared/env.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { sbAdmin } from "../_shared/db.ts";
import { ok, bad } from "../_shared/http.ts";

type CreateBody = {
  identifier: string; length?: number; width?: number; height?: number;
  type?: string; door_type?: string; asset_class?: string;
};

Deno.serve(async (req) => {
  try {
    const sb = sbAdmin();
    const method = req.method.toUpperCase();

    if (method === "POST") {
      const body = await req.json() as CreateBody;
      // Create remote BB asset
      const r = await bbFetch("/1/assets", { method: "POST", body: JSON.stringify(body) }, env.PROJECT_ORG_ID);
      if (r.status !== 201) return bad(`BB create ${r.status} ${await r.text()}`, 502);
      const j = await r.json() as { asset_id: string };

      // Mirror local
      const { data, error } = await sb.from("fleet.assets").insert({
        org_id: env.PROJECT_ORG_ID,
        radar_asset_id: j.asset_id,
        identifier: body.identifier,
        length_cm: body.length ?? null,
        width_cm: body.width ?? null,
        height_cm: body.height ?? null,
        type: body.type ?? null,
        door_type: body.door_type ?? null,
        asset_class: body.asset_class ?? null
      }).select("*").single();
      if (error) return bad(error.message, 500);
      return ok({ asset: data });
    }

    if (method === "PUT") {
      const { radar_asset_id, ...patch } = await req.json() as any;
      if (!radar_asset_id) return bad("radar_asset_id required");

      const r = await bbFetch(`/1/assets/${radar_asset_id}`, {
        method: "PUT", body: JSON.stringify(patch)
      }, env.PROJECT_ORG_ID);
      if (!r.ok) return bad(`BB update ${r.status} ${await r.text()}`, 502);

      const { data, error } = await sb.from("fleet.assets")
        .update({
          identifier: patch.identifier ?? undefined,
          length_cm: patch.length ?? undefined,
          width_cm: patch.width ?? undefined,
          height_cm: patch.height ?? undefined,
          type: patch.type ?? undefined,
          door_type: patch.door_type ?? undefined,
          asset_class: patch.asset_class ?? undefined,
          updated_at: new Date().toISOString()
        })
        .eq("org_id", env.PROJECT_ORG_ID)
        .eq("radar_asset_id", radar_asset_id)
        .select("*").single();
      if (error) return bad(error.message, 500);
      return ok({ asset: data });
    }

    if (method === "DELETE") {
      const { radar_asset_id } = await req.json() as { radar_asset_id: string };
      if (!radar_asset_id) return bad("radar_asset_id required");
      const r = await bbFetch(`/1/assets/${radar_asset_id}`, { method: "DELETE" }, env.PROJECT_ORG_ID);
      if (r.status !== 204) return bad(`BB delete ${r.status} ${await r.text()}`, 502);

      await sb.from("fleet.assets")
        .delete()
        .eq("org_id", env.PROJECT_ORG_ID)
        .eq("radar_asset_id", radar_asset_id);

      return ok();
    }

    return bad("method not allowed", 405);
  } catch (e) {
    return bad(`assetsCrud error: ${e.message}`, 500);
  }
});