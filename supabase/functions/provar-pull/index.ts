/**
 * Provar Pull Edge Function
 * =========================
 * Pulls container data from the Provar.io API (containers-sheet endpoint),
 * which returns a base64-encoded Excel file. Parses it with SheetJS and
 * stores daily snapshots in local Supabase.
 *
 * Endpoint: POST /functions/v1/provar-pull
 * Body (optional):
 *   {
 *     "portals": ["emodal", "yti", ...]   // defaults to all 6
 *   }
 *
 * Environment (Supabase Edge Function secrets — NOT Vite env vars):
 *   PROVAR_API_KEY            — Provar API key (required)
 *   SUPABASE_URL              — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (server-side writes)
 *   ALLOWED_ORIGIN            — optional extra origin for CORS allow-list
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const PROVAR_BASE_URL = "https://app.provar.io/api/public/v1";
const ENDPOINT = "containers-sheet";

const ALL_PORTALS = ["emodal", "yti", "wbct", "lbct", "fms", "apmt"] as const;

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

function asString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim() || null;
}

function asDate(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = val * 86400 * 1000;
    const d = new Date(epoch.getTime() + ms);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

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

async function pullPortalEndpoint(
  portal: string,
  apiKey: string,
): Promise<PullResult> {
  const endpoint = ENDPOINT;
  const url = `${PROVAR_BASE_URL}/${endpoint}?portal=${encodeURIComponent(
    portal,
  )}`;

  let response: Record<string, unknown>;
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
      console.error(msg);
      await logSync(portal, endpoint, "error", 0, msg);
      return { portal, endpoint, status: "error", rows: 0, error: msg };
    }

    response = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    const msg = `Fetch failed: ${String(err)}`;
    console.error(msg);
    await logSync(portal, endpoint, "error", 0, msg);
    return { portal, endpoint, status: "error", rows: 0, error: msg };
  }

  if (response.success !== true) {
    const msg = `Provar response success=false for ${portal}: ${JSON.stringify(response).slice(0, 300)}`;
    console.error(msg);
    await logSync(portal, endpoint, "error", 0, msg);
    return { portal, endpoint, status: "error", rows: 0, error: msg };
  }

  const fileData = response.file_data;
  if (typeof fileData !== "string" || !fileData) {
    const msg = `Provar response missing file_data for ${portal}`;
    console.error(msg);
    await logSync(portal, endpoint, "error", 0, msg);
    return { portal, endpoint, status: "error", rows: 0, error: msg };
  }

  let parsedRows: Record<string, unknown>[] = [];
  try {
    const bytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
    const wb = XLSX.read(bytes, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    parsedRows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
  } catch (err) {
    const msg = `Excel parse failed for ${portal}: ${String(err)}`;
    console.error(msg);
    await logSync(portal, endpoint, "error", 0, msg);
    return { portal, endpoint, status: "error", rows: 0, error: msg };
  }

  const today = new Date().toISOString().slice(0, 10);

  // Delete today's existing snapshot for this portal (idempotent refresh)
  const { error: delErr } = await supabase
    .from("provar_containers_sheet")
    .delete()
    .eq("portal", portal)
    .eq("snapshot_date", today);

  if (delErr) {
    const msg = `Delete failed: ${delErr.message}`;
    console.error(msg);
    await logSync(portal, endpoint, "error", 0, msg);
    return { portal, endpoint, status: "error", rows: 0, error: msg };
  }

  // Map Excel rows → DB schema
  const rows: Array<Record<string, unknown>> = [];
  for (const raw of parsedRows) {
    const container_number = asString(raw["Container #"]);
    if (!container_number) continue;
    rows.push({
      portal,
      container_number,
      trade_type: asString(raw["Trade Type"]),
      status: asString(raw["Status"]),
      line: asString(raw["Line"]),
      vessel_name: asString(raw["Vessel Name"]),
      last_free_day: asDate(raw["Last Free Day"]),
      return_date: asDate(raw["Return Date"]),
      raw_data: raw,
      snapshot_date: today,
    });
  }

  if (rows.length === 0) {
    await logSync(portal, endpoint, "success", 0);
    return { portal, endpoint, status: "success", rows: 0 };
  }

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error: insErr, count } = await supabase
      .from("provar_containers_sheet")
      .insert(chunk, { count: "exact" })
      .select("id");
    if (insErr) {
      const msg = `Insert failed: ${insErr.message}`;
      console.error(msg);
      await logSync(portal, endpoint, "error", inserted, msg);
      return { portal, endpoint, status: "error", rows: inserted, error: msg };
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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
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

  let body: { portals?: string[] } = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    body = {};
  }

  const portalsToRun: string[] =
    Array.isArray(body.portals) && body.portals.length > 0
      ? body.portals.filter((p) =>
          (ALL_PORTALS as readonly string[]).includes(p),
        )
      : [...ALL_PORTALS];

  if (portalsToRun.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid portals specified" }),
      {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  const results: PullResult[] = [];

  for (const portal of portalsToRun) {
    try {
      const result = await pullPortalEndpoint(portal, apiKey);
      results.push(result);
    } catch (err) {
      const msg = `Unexpected error: ${String(err)}`;
      console.error(msg);
      await logSync(portal, ENDPOINT, "error", 0, msg);
      results.push({
        portal,
        endpoint: ENDPOINT,
        status: "error",
        rows: 0,
        error: msg,
      });
    }
  }

  const total_rows = results.reduce((sum, r) => sum + r.rows, 0);
  const errors = results
    .filter((r) => r.status === "error")
    .map((r) => `[${r.portal}/${r.endpoint}] ${r.error ?? "unknown error"}`);

  return new Response(JSON.stringify({ results, total_rows, errors }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
