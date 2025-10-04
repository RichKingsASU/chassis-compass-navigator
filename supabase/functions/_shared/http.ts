export const ok = (data: unknown = { ok: true }) =>
  new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

export const bad = (msg: string, code = 400) =>
  new Response(JSON.stringify({ error: msg }), {
    status: code,
    headers: { "content-type": "application/json" },
  });
