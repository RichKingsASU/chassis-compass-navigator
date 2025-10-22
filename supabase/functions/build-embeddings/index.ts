// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMBED_API_KEY = Deno.env.get("OPENAI_API_KEY")!; // or your provider
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function embed(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${EMBED_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text })
  });
  const j = await r.json();
  return j.data[0].embedding;
}

Deno.serve(async (req) => {
  // 1) fetch pending lines
  const { data: rows, error } = await sb.rpc("get_lines_needing_embeddings");
  if (error) return new Response(error.message, { status: 400 });

  // 2) build embeddings
  const inserts = [];
  for (const r of rows as any[]) {
    const content = [
      `Vendor: ${r.vendor_name}`,
      `Invoice: ${r.invoice_number}`,
      `Line: ${r.line_id}`,
      `Chassis: ${r.chassis_id}`,
      `Container: ${r.container_id}`,
      `Bill: ${r.bill_start?.slice(0,10)} -> ${r.bill_end?.slice(0,10)}`,
      `UseDays: ${r.use_days ?? ""}`,
      `Total: ${r.total ?? ""}`,
      `From: ${r.og_location ?? ""}`,
      `To: ${r.ig_location ?? ""}`,
      `Customer: ${r.billed_customer ?? ""}`
    ].filter(Boolean).join(" | ");

    const vec = await embed(content);
    inserts.push({
      vendor_id: r.vendor_id,
      invoice_id: r.invoice_id,
      line_id: r.line_id,
      content,
      embedding: vec
    });
  }

  if (inserts.length) {
    const { error: insErr } = await sb.from("invoice_line_embeddings").insert(inserts);
    if (insErr) return new Response(insErr.message, { status: 400 });
  }

  return new Response(JSON.stringify({ inserted: inserts.length }), { status: 200 });
});