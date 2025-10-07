import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

async function embedQuery(q: string): Promise<number[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")!;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: q }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const { query } = await req.json().catch(() => ({}));
    if (!query) return new Response(JSON.stringify({ error: "query is required" }), { headers: CORS, status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    // Resolve org from membership
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id ?? null;
    const { data: link } = await supabase.from("user_orgs").select("org_id").eq("user_id", userId).limit(1).maybeSingle();
    if (!link?.org_id) return new Response(JSON.stringify({ error: "No org mapping for user" }), { headers: CORS, status: 403 });

    // Vector path (with graceful fallback)
    let matches: any[] = [];
    try {
      const qVec = await embedQuery(query);
      const { data, error } = await supabase.rpc("match_rag_docs", {
        org: link.org_id,
        query_embedding: qVec,
        match_count: 6
      });
      if (error) throw error;
      matches = data ?? [];
    } catch {
      const { data } = await supabase
        .from("rag_documents")
        .select("source_table, source_pk, content")
        .eq("org_id", link.org_id)
        .ilike("content", `%${query}%`)
        .limit(6);
      matches = (data ?? []).map((d: any) => ({ ...d, score: 0 }));
    }

    return new Response(JSON.stringify({ query, matches }), { headers: { "content-type": "application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: CORS, status: 500 });
  }
});