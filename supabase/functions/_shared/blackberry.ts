import { env } from "./env.ts";
export async function bbFetch(path: string, init: RequestInit = {}, orgId?: string) {
  const headers = new Headers(init.headers);
  if (env.BB_API_KEY) headers.set("Authorization", `Bearer ${env.BB_API_KEY}`);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  const url = orgId ? `${env.BB_API_BASE}/${orgId}${path}` : `${env.BB_API_BASE}${path}`;
  return fetch(url, { ...init, headers });
}
export const toIso = (ms?: number|null) => ms == null ? null : new Date(ms!).toISOString();