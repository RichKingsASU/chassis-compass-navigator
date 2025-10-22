// Minimal, resilient Radar token function for single-tenant "Logistics"
import { importPKCS8, SignJWT } from "jose";

type Json = Record<string, unknown>;
const json = (body: Json, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const REQUIRED = [
  "BLACKBERRY_APP_ID",
  "BLACKBERRY_OAUTH_TOKEN_URL",
  "BLACKBERRY_JWT_AUD",
  "BLACKBERRY_SCOPE",
  "BLACKBERRY_JWT_PRIVATE_KEY",
] as const;

function getEnvStrict(name: string) {
  const v = Deno.env.get(name);
  if (!v || !v.trim()) throw new Error(`missing env ${name}`);
  return v;
}

// Accepts 3 formats for KEY: (a) full PEM with headers, (b) single-line with \n, (c) bare base64 body.
// Always returns a proper PEM string with \n newlines.
function normalizePem(input: string): string {
  const val = input.includes("\n") ? input.replace(/\\n/g, "\n") : input;
  if (val.includes("-----BEGIN") && val.includes("-----END")) {
    // Already PEM; normalize newlines and trim
    return val.replace(/\r\n/g, "\n").trim() + "\n";
  }
  // Looks like a bare base64 block: wrap it
  const base64 = val.replace(/\s+/g, "");
  // Simple sanity: base64 charset only
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) throw new Error("private key is not PEM or base64");
  // Chunk to 64 chars per RFC 7468 (optional, but nice)
  const lines = base64.match(/.{1,64}/g) ?? [base64];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
}

Deno.serve(async (req) => {
  try {
    // 1) Body is optional (org_id not needed for single-tenant)
    let body: any = {};
    try { body = await req.json(); } catch (_) { /* ignore empty body */ }

    // 2) Required env
    const missing = REQUIRED.filter((k) => !Deno.env.get(k));
    if (missing.length) return json({ error: "config_error", detail: { missing } }, 500);

    const APP_ID = getEnvStrict("BLACKBERRY_APP_ID");
    const TOKEN_URL = getEnvStrict("BLACKBERRY_OAUTH_TOKEN_URL");
    const AUD = getEnvStrict("BLACKBERRY_JWT_AUD");
    const SCOPE = getEnvStrict("BLACKBERRY_SCOPE");
    const RAW_KEY = getEnvStrict("BLACKBERRY_JWT_PRIVATE_KEY");

    // 3) Key import (ES256)
    let key;
    try {
      const pem = normalizePem(RAW_KEY);
      key = await importPKCS8(pem, "ES256");
    } catch (e) {
      return json({ error: "import_key_failed", detail: String(e) }, 500);
    }

    // 4) Build client assertion JWT
    const now = Math.floor(Date.now() / 1000);
    let clientAssertion: string;
    try {
      clientAssertion = await new SignJWT ({})
        .setProtectedHeader({ alg: "ES256", typ: "JWT" })
        .setIssuer(APP_ID)
        .setSubject(APP_ID)
        .setAudience(AUD)
        .setIssuedAt(now)
        .setExpirationTime(now + 60)
        .sign(key);
    } catch (e) {
      return json({ error: "sign_jwt_failed", detail: String(e) }, 500);
    }

    // 5) OAuth2 Token exchange
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      scope: body?.scope ?? SCOPE,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
    });

    const r = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: "oauth_failed", status: r.status, detail: data }, 502);

    return json(data, 200); // { access_token, token_type, expires_in, ... }
  } catch (e) {
    return json({ error: "unhandled", detail: String(e) }, 500);
  }
});