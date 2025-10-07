// supabase/functions/bb-backfill/index.ts
// Edge function: BlackBerry backfill with strong debug signals.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type BackfillRequest = {
  org_id: string;
  lookback_days?: number;
  debug?: boolean;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  global: { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
});

async function json(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function res(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return res({ error: "POST only" }, 405);
  }

  const body = (await json(req)) as BackfillRequest;
  const org_id = body.org_id;
  const lookback_days = Math.max(1, Number(body.lookback_days ?? 30));
  const debug = !!body.debug;

  if (!org_id) return res({ error: "org_id required" }, 400);
  if (!SUPABASE_URL) return res({ error: "SUPABASE_URL missing" }, 500);
  if (!SERVICE_ROLE_KEY)
    return res({ error: "SERVICE_ROLE_KEY missing" }, 500);

  // Fetch provider config
  const { data: cfg, error: cfgErr } = await sb
    .from("provider_config")
    .select("options, provider_key")
    .eq("org_id", org_id)
    .eq("provider_key", "blackberry")
    .maybeSingle();

  if (cfgErr) {
    return res({ error: "config_fetch_failed", details: cfgErr.message }, 500);
  }
  if (!cfg?.options) {
    return res({ error: "config_missing_for_org", org_id }, 400);
  }

  const options = cfg.options as any;
  const api_base: string = options.api_base;
  const client_id: string = options.client_id;
  const client_secret: string = options.client_secret;
  const account_ids: string[] = options.account_ids ?? [];

  if (!api_base || !client_id || !client_secret || account_ids.length === 0) {
    return res({ 
      error: "config_incomplete",
      have: {
        api_base: !!api_base,
        client_id: !!client_id,
        client_secret: !!client_secret,
        account_ids: account_ids.length,
      },
    }, 400);
  }

  // DEBUG PATH: prove service-role insert into staging works
  if (debug) {
    const probe = {
      org_id,
      external_device_id: "probe-debug",
      ts: new Date().toISOString(),
      lat: 0,
      lon: 0,
      speed_kmh: 0,
      hdop: 0.0,
      raw: { probe: true },
      source: "bb-backfill-debug",
    };

    const { error: insErr } = await sb
      .from("staging_blackberry_locations")
      .insert([probe]);

    // clean up best-effort
    await sb
      .from("staging_blackberry_locations")
      .delete()
      .eq("org_id", org_id)
      .eq("external_device_id", "probe-debug");

    return res({
      ok: !insErr,
      mode: "debug",
      can_insert_staging: !insErr,
      insert_error: insErr?.message ?? null,
      service_key_hint: `${SERVICE_ROLE_KEY.slice(0, 8)}… (${SERVICE_ROLE_KEY.length} chars)`,
      org_id,
      lookback_days,
      provider_key: "blackberry",
      api_base,
      accounts: account_ids.length,
    });
  }

  // REAL PULL (skeleton): call BB API, stream pages, write staging (ts/lat/lon…)
  // You can adapt endpoint paths/params here to your tenant’s API.
  // This block returns clear error JSON if BB rejects credentials/network.
  try {
    const sinceIso = new Date(Date.now() - lookback_days * 86400_000).toISOString();
    const targetUrl = `${api_base.replace(/\/+$/, "")}/locations/search?since=${encodeURIComponent(sinceIso)}&accounts=${encodeURIComponent(account_ids.join(","))}`;

    const bbResp = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": client_id,
        "X-Client-Secret": client_secret,
      },
    });

    const snippet = await bbResp.text().catch(() => "");
    if (!bbResp.ok) {
      return res({
        error: "blackberry_http_error",
        status: bbResp.status,
        url: targetUrl,
        body_snippet: snippet.slice(0, 500),
      }, 502);
    }

    // Expect JSON array of points – adjust mapping to your real shape.
    let items: any[] = [];
    try {
      items = JSON.parse(snippet);
    } catch {
      return res({ error: "blackberry_parse_error", body_snippet: snippet.slice(0, 500) }, 502);
    }

    // Map into staging rows
    const rows = items.map((it) => ({
      org_id,
      external_device_id: String(it.device_id ?? it.device ?? "unknown"),
      ts: new Date(it.timestamp ?? it.recorded_at ?? Date.now()).toISOString(),
      lat: Number(it.lat ?? it.latitude),
      lon: Number(it.lon ?? it.longitude),
      speed_kmh: it.speed_kmh ?? (it.speed_mps ? it.speed_mps * 3.6 : null),
      hdop: it.hdop ?? null,
      raw: it,
      source: "blackberry",
    })).filter(r => 
      Number.isFinite(r.lat) && 
      Number.isFinite(r.lon) && 
      !!r.external_device_id && 
      !!r.ts
    );

    // Batch insert
    if (rows.length) {
      const { error: insErr } = await sb
        .from("staging_blackberry_locations")
        .insert(rows, { count: "exact" });

      if (insErr) {
        return res({ error: "staging_insert_error", details: insErr.message }, 500);
      }
    }

    return res({ ok: true, inserted: rows.length, lookback_days });
  } catch (e) {
    return res({ error: "worker_exception", message: String(e) }, 500);
  }
});
