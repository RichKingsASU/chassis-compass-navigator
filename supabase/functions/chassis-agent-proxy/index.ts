/**
 * Chassis Agent Proxy
 * ===================
 * Forwards multi-turn chat requests from the Chassis Detail page to the
 * Anthropic Messages API while keeping the API key server-side.
 *
 * Body:
 *   {
 *     system: string,                        // system prompt
 *     messages: { role, content }[],         // conversation history
 *     model?: string,                        // optional override
 *     max_tokens?: number                    // optional override
 *   }
 *
 * Returns the raw Anthropic response JSON.
 */

const ANTHROPIC_KEY =
  Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("CLAUDE_API_KEY") ?? "";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 2000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY is not configured on the Edge Function (set it in supabase/functions/.env.local).",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let body: {
    system?: string;
    messages?: ChatMessage[];
    model?: string;
    max_tokens?: number;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const payload: Record<string, unknown> = {
    model: body.model || DEFAULT_MODEL,
    max_tokens: body.max_tokens || DEFAULT_MAX_TOKENS,
    messages,
  };

  if (body.system && body.system.trim().length > 0) {
    payload.system = body.system;
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      ...corsHeaders,
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });
});
