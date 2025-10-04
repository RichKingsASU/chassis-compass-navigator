// supabase/functions/_shared/blackberry.ts
import { env } from "./env.ts";

const TOKEN_URL = "https://oauth2.radar.blackberry.com/1/token";

// ------------ helpers
const enc = new TextEncoder();
const b64u = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const toBytes = (ab: ArrayBuffer) => new Uint8Array(ab);

/** Strip headers and any non-base64 chars, then decode to bytes */
function pemToPkcs8(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN[\s\S]+?-----/g, "")
    .replace(/-----END[\s\S]+?-----/g, "")
    .replace(/[^A-Za-z0-9+/=]/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** DER <-> JOSE helpers for ECDSA P-256 */
function derToJose(sig: Uint8Array): Uint8Array {
  // If this already looks like raw r||s (64 bytes), just return it
  if (sig.length === 64) return sig;

  // Expect DER SEQUENCE(0x30) of two INTEGERs
  let offset = 0;
  if (sig[offset++] !== 0x30) throw new Error("Invalid DER (no SEQUENCE)");

  let seqLen = sig[offset++];
  if (seqLen & 0x80) { // long form
    const n = seqLen & 0x7f;
    seqLen = 0;
    for (let i = 0; i < n; i++) seqLen = (seqLen << 8) | sig[offset++];
  }

  if (sig[offset++] !== 0x02) throw new Error("Invalid DER (no INTEGER r)");
  let rLen = sig[offset++];
  while (rLen > 0 && sig[offset] === 0x00) {
    offset++;
    rLen--;
  } // strip leading zero
  const r = sig.slice(offset, offset + rLen);
  offset += rLen;

  if (sig[offset++] !== 0x02) throw new Error("Invalid DER (no INTEGER s)");
  let sLen = sig[offset++];
  while (sLen > 0 && sig[offset] === 0x00) {
    offset++;
    sLen--;
  }
  const s = sig.slice(offset, offset + sLen);

  // Left-pad to 32 bytes each
  const r32 = new Uint8Array(32);
  r32.set(r, 32 - r.length);
  const s32 = new Uint8Array(32);
  s32.set(s, 32 - s.length);
  const raw = new Uint8Array(64);
  raw.set(r32, 0);
  raw.set(s32, 32);
  return raw;
}

function importPkcs8Key(pem: string): Promise<CryptoKey> {
  const pkcs8 = pemToPkcs8(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function es256Sign(compact: string, key: CryptoKey): Promise<string> {
  const sig = toBytes(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      enc.encode(compact),
    ),
  );
  const jose = derToJose(sig);
  return b64u(jose);
}

function headerPayload(appId: string, aud: string, kid?: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", typ: "JWT", kid };
  const payload = {
    jti: crypto.randomUUID(),
    iss: appId,
    sub: appId,
    aud,
    iat: now,
    exp: now + 60, // 60s validity
  };
  const h = b64u(enc.encode(JSON.stringify(header)));
  const p = b64u(enc.encode(JSON.stringify(payload)));
  return { compact: `${h}.${p}` };
}

// ------------- token cache
let accessToken = "";
let tokenExp = 0;

// ------------- public fetch wrapper
export async function bbFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await getAccessToken()}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const url = `https://api.radar.blackberry.com/1${path}`;
  return fetch(url, { ...init, headers });
}

async function getAccessToken(): Promise<string> {
  // If user insisted on API key (legacy), allow non-empty value
  if (env.BB_API_KEY && env.BB_API_KEY.length > 0) return env.BB_API_KEY;

  if (!env.BB_APP_ID || !env.BB_JWT_PRIVATE_KEY) {
    throw new Error("Missing BB_APP_ID or BB_JWT_PRIVATE_KEY");
  }

  const now = Date.now();
  if (accessToken && now < tokenExp - 5_000) return accessToken;

  // Build client assertion
  const { compact } = headerPayload(env.BB_APP_ID, env.BB_JWT_AUD, env.BB_JWT_KID);
  const key = await importPkcs8Key(env.BB_JWT_PRIVATE_KEY);
  const sig = await es256Sign(compact, key);
  const clientJwt = `${compact}.${sig}`;

  // Exchange for access token
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: clientJwt,
      scope: env.BB_SCOPE,
    }),
  });
  if (!r.ok) {
    throw new Error(`Radar OAuth failed: ${r.status} ${await r.text()}`);
  }
  const j = await r.json();
  accessToken = j.access_token;
  tokenExp = Date.now() + (j.expires_in ?? 900) * 1000;
  return accessToken;
}

export const toIso = (ms?: number | null) => ms == null ? null : new Date(ms).toISOString();
