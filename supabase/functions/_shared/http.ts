export const ok = (data: unknown = { ok: true }) =>
  new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
export const bad = (msg: string, code = 400) =>
  new Response(JSON.stringify({ error: msg }), { status: code, headers: { "Content-Type": "application/json" } });
export async function requireSecret(req: Request, expected: string) {
  const got = req.headers.get("x-cron-secret");
  if (!expected || got !== expected) throw new Error("forbidden");
}