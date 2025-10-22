// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function embed(q: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: q })
  });
  const j = await r.json();
  return j.data[0].embedding;
}

Deno.serve(async (req) => {
  const { question, vendor = null, k = 8, threshold = 0.2 } = await req.json();

  const qvec = await embed(question);
  const { data, error } = await sb.rpc("search_invoice_lines", {
    query_embedding: qvec,
    match_count: k,
    similarity_threshold: threshold,
    vendor
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  // Optional: call a chat model to summarize; for now, return matches
  return new Response(JSON.stringify({ matches: data }), { status: 200 });
});