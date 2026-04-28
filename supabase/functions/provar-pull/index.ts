/**
 * Provar Pull Edge Function
 * =========================
 * Pulls read-only container and to-return data from the Provar.io API
 * and stores daily snapshots in local Supabase.
 *
 * Endpoint: POST /functions/v1/provar-pull
 * Body (optional):
 *   {
 *     "portals": ["emodal", "yti", ...],     // defaults to all 6
 *     "endpoints": ["containers-sheet", ...] // defaults to both
 *   }
 *
 * Environment (Supabase Edge Function secrets — NOT Vite env vars):
 *   PROVAR_API_KEY            — Provar API key (required)
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (server-side writes)
 *   ALLOWED_ORIGIN            — optional extra origin for CORS allow-list
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROVAR_BASE_URL = "https://app.provar.io/api/public/v1";

const ALL_PORTALS = ["emodal", "yti", "wbct", "lbct", "fms", "apmt"] as const;
const ALL_ENDPOINTS = ["containers-sheet", "to-return"] as const;

type Portal = (typeof ALL_PORTALS)[number];
type Endpoint = (typeof ALL_ENDPOINTS)[number];

interface PullResult {
  portal: string;
  endpoint: string;
  status: "success" | "error";
  rows: number;
  error?: string;
}

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  Deno.env.get("ALLOWED_ORIGIN") ?? "",
].filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// ── Normalize a raw item (string OR object) into a jsonb-safe object ──
function normalizeRaw(item: unknown): Record<string, unknown> {
  if (typeof item === "string") {
    return { container_number: item };
  }
  if (item && typeof item === "object") {
    return item as Record<string, unknown>;
  }
  return { value: item };
}

// ── Safe string coercion ──
function asString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val);
}

// ── Safe date string (YYYY-MM-DD) ──
function asDate(val: unknown): string | null {
  if (!val) return null;
  const s = String(val);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ── Extract container_number for containers-sheet rows ──
function extractContainerNumber(raw: Record<string, unknown>): string | null {
  return (
    asString(raw["Container #"]) ??
    asString(raw["container_number"]) ??
    asString(raw["container_id"]) ??
    null
  );
}

// ── Log a sync attempt ──
async function logSync(
  portal: string,
  endpoint: string,
  status: "success" | "error",
  rowsAffected: number,
  errorMessage?: string,
): Promise<void> {
  await supabase.from("provar_sync_log").insert({
    portal,
    endpoint,
    status,
    rows_affected: rowsAffected,
    error_message: errorMessage ?? null,
  });
}

// ── Fetch one portal+endpoint from Provar and store in local DB ──
async function pullPortalEndpoint(
  portal: string,
  endpoint: string,
  apiKey: string,
): Promise<PullResult> {
  const url = `${PROVAR_BASE_URL}/${endpoint}?portal=${encodeURIComponent(
    portal,
  )}`;

  let apiData: unknown;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      const msg = `Provar ${endpoint} for ${portal} returned ${res.status}: ${errText.slice(0, 300)}`;
      await logSync(portal, endpoint, "error", 0, msg);
      return {
        portal,
        endpoint,
        status: "error",
        rows: 0,
        error: msg,
      };
    }

    apiData = await res.json();
  } catch (err) {
    const msg = `Fetch failed: ${String(err)}`;
    await logSync(portal, endpoint, "error", 0, msg);
    return {
      portal,
      endpoint,
      status: "error",
      rows: 0,
      error: msg,
    };
  }

  // Normalize to array
  let items: unknown[] = [];
  if (Array.isArray(apiData)) {
    items = apiData;
  } else if (apiData && typeof apiData === "object") {
    // Some APIs wrap in { data: [...] } — accept that too
    const wrapped = (apiData as Record<string, unknown>).data;
    items = Array.isArray(wrapped) ? wrapped : [apiData];
  }

  const table =
    endpoint === "containers-sheet"
      ? "provar_containers_sheet"
      : "provar_to_return";

  const today = new Date().toISOString().slice(0, 10);

  // Delete today's existing snapshot for this portal+endpoint (idempotent refresh)
  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .eq("portal", portal)
    .eq("snapshot_date", today);

  if (delErr) {
    const msg = `Delete failed: ${delErr.message}`;
    await logSync(portal, endpoint, "error", 0, msg);
    return {
      portal,
      endpoint,
      status: "error",
      rows: 0,
      error: msg,
    };
  }

  // Build rows
  const rows = items.map((item) => {
    const raw = normalizeRaw(item);
    if (endpoint === "containers-sheet") {
      return {
        portal,
        container_number: extractContainerNumber(raw),
        trade_type:
          asString(raw["trade_type"]) ?? asString(raw["Trade Type"]),
        line: asString(raw["line"]) ?? asString(raw["Line"]),
        raw_data: raw,
        snapshot_date: today,
      };
    }
    // to-return
    return {
      portal,
      container_id:
        asString(raw["container_id"]) ??
        asString(raw["Container #"]) ??
        asString(raw["container_number"]),
      return_date:
        asDate(raw["return_date"]) ?? asDate(raw["Return Date"]),
      raw_data: raw,
      snapshot_date: today,
    };
  });

  if (rows.length === 0) {
    await logSync(portal, endpoint, "success", 0);
    return { portal, endpoint, status: "success", rows: 0 };
  }

  // Insert in chunks of 500
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error: insErr, count } = await supabase
      .from(table)
      .insert(chunk, { count: "exact" })
      .select("id");
    if (insErr) {
      const msg = `Insert failed: ${insErr.message}`;
      await logSync(portal, endpoint, "error", inserted, msg);
      return {
        portal,
        endpoint,
        status: "error",
        rows: inserted,
        error: msg,
      };
    }
    inserted += count ?? chunk.length;
  }

  await logSync(portal, endpoint, "success", inserted);
  return { portal, endpoint, status: "success", rows: inserted };
}

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  const apiKey = Deno.env.get("PROVAR_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "PROVAR_API_KEY is not set. Run: npx supabase secrets set PROVAR_API_KEY=YOUR_KEY",
      }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  let body: { portals?: string[]; endpoints?: string[] } = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    body = {};
  }

  const portalsToRun: string[] =
    Array.isArray(body.portals) && body.portals.length > 0
      ? body.portals.filter((p) => (ALL_PORTALS as readonly string[]).includes(p))
      : [...ALL_PORTALS];

  const endpointsToRun: string[] =
    Array.isArray(body.endpoints) && body.endpoints.length > 0
      ? body.endpoints.filter((e) =>
          (ALL_ENDPOINTS as readonly string[]).includes(e),
        )
      : [...ALL_ENDPOINTS];

  if (portalsToRun.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid portals specified" }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  if (endpointsToRun.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid endpoints specified" }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  const results: PullResult[] = [];

  for (const portal of portalsToRun) {
    for (const endpoint of endpointsToRun) {
      try {
        const result = await pullPortalEndpoint(portal, endpoint, apiKey);
        results.push(result);
      } catch (err) {
        const msg = `Unexpected error: ${String(err)}`;
        await logSync(portal, endpoint, "error", 0, msg);
        results.push({
          portal,
          endpoint,
          status: "error",
          rows: 0,
          error: msg,
        });
      }
    }
  }

  const total_rows = results.reduce((sum, r) => sum + r.rows, 0);
  const errors = results
    .filter((r) => r.status === "error")
    .map((r) => `[${r.portal}/${r.endpoint}] ${r.error ?? "unknown error"}`);

  return new Response(
    JSON.stringify({ results, total_rows, errors }),
    {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    },
  );
});
