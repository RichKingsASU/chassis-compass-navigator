const MULTI_TENANT = Deno.env.get("BLACKBERRY_MULTI_TENANT") === "1";

// add this helper (top or near bbFetch)
async function fetchRadarToken(orgId: string, scope: string): Promise<string> {
  const url =
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/radar-token`;
  const auth =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; // you have SUPABASE_SERVICE_ROLE_KEY set
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify({ org_id: orgId, scope }),
  });
  if (!r.ok) throw new Error(`radar-token failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  // supports either {access_token:"..."} or raw token string
  return (j && j.access_token) ? j.access_token : j;
}

// --- helpers (replace your existing need/secret reads with this) ---
function must(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing required secret: ${name}`);
  return v;
}

type BBSecrets = {
  APP_ID: string;
  JWT_PRIVATE_KEY: string;
  JWT_AUD: string;
  OAUTH_TOKEN_URL: string;
  SCOPE: string;
  API_KEY?: string; // optional
};

function readBBSecrets(prefix: string): BBSecrets {
  const g = (n: string) => Deno.env.get(`${prefix}_${n}`);
  return {
    APP_ID:         must(`${prefix}_APP_ID`,         g("APP_ID")),
    JWT_PRIVATE_KEY:must(`${prefix}_JWT_PRIVATE_KEY`,g("JWT_PRIVATE_KEY")),
    JWT_AUD:        must(`${prefix}_JWT_AUD`,        g("JWT_AUD")),
    OAUTH_TOKEN_URL:must(`${prefix}_OAUTH_TOKEN_URL`,g("OAUTH_TOKEN_URL")),
    SCOPE:          must(`${prefix}_SCOPE`,          g("SCOPE")),
    API_KEY:        g("API_KEY") || undefined, // optional
  };
}

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
    pkcs8.buffer as ArrayBuffer,
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

// cache tokens per-tenant (optional but recommended)
const tokenCache = new Map<string, { token: string; exp: number }>();

async function getAccessToken(prefix: string, s: BBSecrets): Promise<string> {
  console.log("BB_OAUTH_TOKEN_URL =", s.OAUTH_TOKEN_URL);
  // if you already have code that builds a JWT and posts to s.OAUTH_TOKEN_URL,
  // reuse it here; just remove any BB_* direct reads and use `s.*` instead.

  // example: check cache
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(prefix);
  if (cached && cached.exp > now + 60) return cached.token;

  // Build client assertion
  const { compact } = headerPayload(s.APP_ID, s.JWT_AUD, Deno.env.get(`${prefix}_JWT_KID`));
  const key = await importPkcs8Key(s.JWT_PRIVATE_KEY);
  const sig = await es256Sign(compact, key);
  const clientJwt = `${compact}.${sig}`;

  // Exchange for access token
  const r = await fetch(s.OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: clientJwt,
      scope: s.SCOPE,
    }),
  });
  if (!r.ok) {
    throw new Error(`Radar OAuth failed: ${r.status} ${await r.text()}`);
  }
  const j = await r.json();
  const access_token = j.access_token;
  const expires_in = j.expires_in ?? 900;
  
  tokenCache.set(prefix, { token: access_token, exp: now + expires_in });
  return access_token;
}

export async function bbFetch(
  path: string,
  init: RequestInit = {},
  orgId?: string,   // make optional
): Promise<Response> {
  // In single-tenant, just use global (no per-org prefix)
  const s = readBBSecrets("BLACKBERRY"); // relies on global BLACKBERRY_* envs

  // Always get token via radar-token
  const token = await fetchRadarToken("GLOBAL", s.SCOPE);

  const baseUrl = Deno.env.get("BLACKBERRY_API_BASE") ?? "https://api.radar.blackberry.com";
  const url = `${baseUrl}${path}`;

  const headers = new Headers(init.headers ?? {});
  headers.set("authorization", `Bearer ${token}`);
  if (s.API_KEY && !headers.has("x-api-key")) headers.set("x-api-key", s.API_KEY);

  return fetch(url, { ...init, headers });
}

export const toIso = (ms?: number | null) => ms == null ? null : new Date(ms).toISOString();
