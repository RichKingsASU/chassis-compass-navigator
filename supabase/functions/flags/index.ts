import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

type FlagsMap = Record<string, { enabled?: boolean; variant?: string; [k: string]: unknown }>;

const CORS = {
  "Access-Control-Allow-Origin": "*", // or your app origin
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!, // keep anon; we pass through the caller's JWT below
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const hinted = await req.json().catch(() => ({}));
    const hintedRole: string | null = hinted?.role ?? null;

    // Who is calling?
    const { data: u } = await supabase.auth.getUser();
    const userId = u?.user?.id ?? null;

    // Resolve org + default role from membership
    const { data: link } = await supabase
      .from("user_orgs")
      .select("org_id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (!link?.org_id) {
      return new Response(JSON.stringify({ error: "No org mapping for user" }), { status: 403 });
    }
    const orgId = link.org_id as string;
    const role = hintedRole ?? link.role ?? "dispatcher";

    const out: FlagsMap = {};

    // 1) user-scoped
    if (userId) {
      const { data } = await supabase
        .from("feature_flags")
        .select("key,value")
        .eq("org_id", orgId).eq("scope", "user").eq("user_id", userId);
      for (const r of data ?? []) out[r.key] = r.value as FlagsMap[string];
    }

    // 2) role-scoped
    if (role) {
      const { data } = await supabase
        .from("feature_flags")
        .select("key,value")
        .eq("org_id", orgId).eq("scope", "role").eq("role", role);
      for (const r of data ?? []) if (!(r.key in out)) out[r.key] = r.value as FlagsMap[string];
    }

    // 3) global
    const { data: gRows } = await supabase
      .from("feature_flags")
      .select("key,value")
      .eq("org_id", orgId).eq("scope", "global");
    for (const r of gRows ?? []) if (!(r.key in out)) out[r.key] = r.value as FlagsMap[string];

    return new Response(JSON.stringify(out), { headers: { "content-type": "application/json", ...CORS }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { headers: { "content-type": "application/json", ...CORS }, status: 500 });
  }
});