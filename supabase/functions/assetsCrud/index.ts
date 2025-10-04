// supabase/functions/assetsCrud/index.ts
import { env } from "../_shared/env.ts";
import { bbFetch } from "../_shared/blackberry.ts";
import { sbAdmin } from "../_shared/db.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AssetPayload = {
  radar_asset_id?: string;
  identifier?: string;
  type?: string;
  asset_class?: string;
  door_type?: string;
  length?: number;
  width?: number;
  height?: number;
};

async function radarCreateAsset(p: Required<Pick<AssetPayload, "identifier">> & AssetPayload) {
  const r = await bbFetch(`/assets`, {
    method: "POST",
    body: JSON.stringify({
      identifier: p.identifier,
      type: p.type,
      asset_class: p.asset_class,
      door_type: p.door_type,
      length: p.length,
      width: p.width,
      height: p.height,
    }),
  });

  if (r.status === 201 || r.status === 200) {
    const j = await r.json();
    // Adjust if Radar returns a different shape
    return { id: j.id ?? j.asset_id ?? j.radar_asset_id };
  }

  if (r.status === 409) {
    // duplicate -> we'll resolve below
    return { duplicate: true as const };
  }

  throw new Response(
    JSON.stringify({ error: `Radar create failed: ${r.status}`, detail: await r.text() }),
    {
      status: 502,
      headers: { "content-type": "application/json", ...corsHeaders },
    },
  );
}

async function radarFindByIdentifier(identifier: string): Promise<string | null> {
  // If Radar supports filtering by identifier directly:
  const r = await bbFetch(`/assets?identifier=${encodeURIComponent(identifier)}&size=1`);
  if (!r.ok) throw new Error(`Radar search failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const items = j.items ?? j.assets ?? [];
  if (!items.length) return null;
  const first = items[0];
  return first.id ?? first.asset_id ?? first.radar_asset_id ?? null;
}

async function radarUpdateAsset(id: string, p: AssetPayload) {
  const r = await bbFetch(`/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      // only send defined fields
      ...(p.identifier ? { identifier: p.identifier } : {}),
      ...(p.type ? { type: p.type } : {}),
      ...(p.asset_class ? { asset_class: p.asset_class } : {}),
      ...(p.door_type ? { door_type: p.door_type } : {}),
      ...(p.length != null ? { length: p.length } : {}),
      ...(p.width != null ? { width: p.width } : {}),
      ...(p.height != null ? { height: p.height } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Radar update failed: ${r.status} ${await r.text()}`);
}

async function radarDeleteAsset(id: string) {
  const r = await bbFetch(`/assets/${id}`, { method: "DELETE" });
  if (!(r.ok || r.status === 204)) {
    throw new Error(`Radar delete failed: ${r.status} ${await r.text()}`);
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json", ...corsHeaders },
    ...init,
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const sb = sbAdmin(); // db schema should be set to "fleet" in _shared/db.ts
    const body = (await req.json().catch(() => ({}))) as AssetPayload;

    switch (req.method) {
      case "POST": {
        // require identifier to create
        if (!body.identifier) return json({ error: "identifier is required" }, { status: 400 });

        // 1) Try create
        const res = await radarCreateAsset(
          body as Required<Pick<AssetPayload, "identifier">> & AssetPayload,
        );

        // 2) If duplicate, resolve its id
        let radar_id: string | null = "id" in res ? (res.id as string) : null;
        if (!radar_id && "duplicate" in res) {
          radar_id = await radarFindByIdentifier(body.identifier!);
          if (!radar_id) {
            return json({ error: `Radar asset not found for identifier "${body.identifier}"` }, {
              status: 404,
            });
          }
        }

        // 3) Upsert locally
        const { data, error } = await sb
          .from("assets")
          .upsert(
            {
              org_id: env.PROJECT_ORG_ID,
              radar_asset_id: radar_id,
              identifier: body.identifier,
              type: body.type ?? null,
              asset_class: body.asset_class ?? null,
              door_type: body.door_type ?? null,
              length: body.length ?? null,
              width: body.width ?? null,
              height: body.height ?? null,
            },
            { onConflict: "org_id,identifier" },
          )
          .select("id, radar_asset_id, identifier")
          .single();

        if (error) throw error;

        return json({ ok: true, asset: data });
      }

      case "PUT": {
        // resolve radar id
        let radar_id = body.radar_asset_id ?? null;
        if (!radar_id) {
          if (!body.identifier) {
            return json({ error: "Provide radar_asset_id or identifier" }, { status: 400 });
          }
          radar_id = await radarFindByIdentifier(body.identifier);
          if (!radar_id) {
            return json({ error: `Radar asset not found for identifier "${body.identifier}"` }, {
              status: 404,
            });
          }
        }

        await radarUpdateAsset(radar_id, body);

        // mirror update locally (by radar_asset_id)
        const { data, error } = await sb
          .from("assets")
          .update({
            type: body.type ?? null,
            asset_class: body.asset_class ?? null,
            door_type: body.door_type ?? null,
            length: body.length ?? null,
            width: body.width ?? null,
            height: body.height ?? null,
            updated_at: new Date().toISOString(),
            ...(body.identifier ? { identifier: body.identifier } : {}),
          })
          .eq("org_id", env.PROJECT_ORG_ID)
          .eq("radar_asset_id", radar_id)
          .select("id, radar_asset_id, identifier")
          .maybeSingle();

        if (error) throw error;

        return json({ ok: true, asset: data });
      }

      case "DELETE": {
        // resolve radar id
        let radar_id = body.radar_asset_id ?? null;
        if (!radar_id) {
          if (!body.identifier) {
            return json({ error: "Provide radar_asset_id or identifier" }, { status: 400 });
          }
          radar_id = await radarFindByIdentifier(body.identifier!);
          if (!radar_id) {
            return json({ error: `Radar asset not found for identifier "${body.identifier}"` }, {
              status: 404,
            });
          }
        }

        await radarDeleteAsset(radar_id);

        // delete locally
        const { error } = await sb
          .from("assets")
          .delete()
          .eq("org_id", env.PROJECT_ORG_ID)
          .eq("radar_asset_id", radar_id);

        if (error) throw error;

        return json({ ok: true, deleted: radar_id });
      }

      default:
        return json({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (e: unknown) {
    const msg = typeof e === "string" ? e : e?.message ?? "Unknown error";
    // If we threw a Response above, return it as-is
    if (e instanceof Response) return e;
    return json({ error: msg }, { status: 500 });
  }
});
