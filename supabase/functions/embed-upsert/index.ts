import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type DocInput = {
  org_id: string;
  docs: { source_table: string; source_pk: string; content: string }[];
};

async function embed(texts: string[]): Promise<number[][]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")!;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.data.map((d: any) => d.embedding);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const body = (await req.json()) as DocInput;
    if (!body?.org_id || !Array.isArray(body?.docs)) {
      return new Response(JSON.stringify({ error: "org_id and docs are required" }), { headers: CORS, status: 400 });
    }

    const vectors = await embed(body.docs.map(d => d.content));

    // Use PostgREST directly via service role (no supabase-js needed)
    const serviceKey = Deno.env.get("SERVICE_ROLE_KEY")!;
    const url = `${Deno.env.get("SUPABASE_URL")}/rest/v1/rag_documents`;
    const payload = body.docs.map((d, i) => ({
      org_id: body.org_id, source_table: d.source_table, source_pk: d.source_pk,
      content: d.content, embedding: vectors[i]
    }));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"  // upsert if you defined a conflict target
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());

    return new Response(JSON.stringify({ ok: true, upserted: payload.length }), { headers: { "content-type": "application/json", ...CORS }});
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: CORS, status: 500 });
  }
});