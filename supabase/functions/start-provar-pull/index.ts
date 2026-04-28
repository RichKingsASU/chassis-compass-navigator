/**
 * Start Provar Pull Edge Function
 * ==============================
 * Triggered on-demand from the UI "Pull All Portals" button.
 * Creates a tracking record in `provar_pull_runs` and dispatches the worker.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const body = await req.json();
    const portal = body.portal || "all";
    const dateRange = body.dateRange || "last_7_days";

    // 1. Create provar_pull_runs row
    const { data: run, error: runError } = await supabase
      .from("provar_pull_runs")
      .insert({
        status: "queued",
        portal,
        date_range: dateRange,
        metadata: { ...body },
      })
      .select()
      .single();

    if (runError) throw runError;

    // 2. Dispatch worker
    // For now, we'll try to call the internal worker endpoint.
    // In a real environment, this might be a queue or a separate long-running service.
    const workerUrl = Deno.env.get("WORKER_INTERNAL_URL");
    const workerToken = Deno.env.get("WORKER_INTERNAL_TOKEN");

    if (workerUrl && workerToken) {
      // Non-blocking call to the worker
      fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${workerToken}`,
        },
        body: JSON.stringify({
          run_id: run.id,
          portal,
          dateRange,
        }),
      }).catch((err) => console.error("Failed to dispatch worker:", err));
    } else {
      console.warn("WORKER_INTERNAL_URL or WORKER_INTERNAL_TOKEN not set. Run created but not dispatched.");
    }

    return new Response(JSON.stringify({ run_id: run.id }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error starting Provar pull:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
