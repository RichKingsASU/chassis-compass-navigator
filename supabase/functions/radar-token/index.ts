// supabase/functions/radar-token/index.ts
// Mint a Radar access token via JWT-bearer, per org.
// POST { org_id: string, scope?: string }  ->  { access_token, expires_in, scope }
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SignJWT, importPKCS8, decodeJwt } from "https://deno.land/x/jose@v4.15.5/index.ts";
const TOKEN_URL = Deno.env.get("BLACKBERRY_OAUTH_TOKEN_URL")
  ?? "https://oauth2.radar.blackberry.com/1/token";

// Critical: audience must match token URL exactly.
const AUD = TOKEN_URL;

const DEFAULT_SCOPE = Deno.env.get("BLACKBERRY_SCOPE")
  ?? "modules:read assets:read";

// Single-tenant: ignore org_id mapping; use global app + key
const APP_ID = Deno.env.get("BLACKBERRY_APP_ID") ?? "";
const KEY_ENV = "BLACKBERRY_JWT_PRIVATE_KEY";


// very small in-memory cache per function instance
const tokenCache = new Map<string, { token: string; exp: number }>();

function now() { return Math.floor(Date.now() / 1000); }

serve(async (req) => {
  const auth = req.headers.get("authorization");
  console.log("AUTH HEADER", auth);
  try {
    const body = (await req.json().catch(() => ({}))) as { org_id?: string; scope?: string, probe?: string };
    const { org_id, scope } = body;
    // org_id is ignored in single-tenant mode

    const pem = Deno.env.get(KEY_ENV);
    if (!pem) return json({ error: `missing private key secret ${KEY_ENV}` }, 500);

    const cacheKey = `${org_id}|${scope ?? DEFAULT_SCOPE}`;
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.exp - now() > 120) { // >2 min left
      const decoded = decodeJwt(cached.token);
      return json({
        access_token: cached.token,
        expires_in: cached.exp - now(),
        scope: scope ?? DEFAULT_SCOPE,
        meta: {
          app_id_used: APP_ID,
          org_id: org_id,
          radar_customerId: decoded["radar:customerId"],
        }
      });
    }

    const iat = now();
    const jwt = await new SignJWT({
      jti: crypto.randomUUID(),
      iss: APP_ID,
      sub: APP_ID,
      aud: AUD,
      iat,
      exp: iat + 60, // Radar expects ~60s window
    })
      .setProtectedHeader({ alg: "ES256", typ: "JWT" })
      .sign(await importPKCS8(pem, "ES256"));

    const resp = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
        scope: scope ?? DEFAULT_SCOPE,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return json({ error: "token_exchange_failed", status: resp.status, body: text }, 502);
    }

    const data = await resp.json() as { access_token: string; expires_in: number; scope?: string };
    tokenCache.set(cacheKey, { token: data.access_token, exp: now() + (data.expires_in ?? 900) });
    
    const decoded = decodeJwt(data.access_token);

    if (body?.probe === 'modules') {
      const r = await fetch('https://api.radar.blackberry.com/1/modules', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      const www = r.headers.get('www-authenticate') || null;
      const reqId = r.headers.get('x-request-id') || r.headers.get('cf-ray') || null;
      const text = await r.text();
      return json({
        access_token: data.access_token,
        meta: {
          app_id_used: APP_ID,
          org_id: org_id,
          radar_customerId: decoded["radar:customerId"],
        },
        probe: { status: r.status, wwwAuthenticate: www, requestId: reqId, body: text?.slice(0, 400) }
      });
    }

    return json({
      access_token: data.access_token,
      token_type: "bearer",
      expires_in: data.expires_in,
      scope: data.scope,
      meta: {
        app_id_used: APP_ID,
        org_id: org_id,
        radar_customerId: decoded["radar:customerId"],
      }
    });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
