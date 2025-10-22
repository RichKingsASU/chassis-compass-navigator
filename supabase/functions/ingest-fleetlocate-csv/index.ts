// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

type Row = Record<string, any>;

async function readCsvFromStorage(bucket: string, path: string) {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw error;
  return await data.text();
}

async function parseCsv(text: string): Promise<Row[]> {
  const { parse } = await import("https://deno.land/std@0.224.0/csv/parse.ts");
  const rows = await parse(text, { skipFirstRow: true }) as any[];
  if (!rows.length) return [];
  const headers = [
    "asset_id", "group", "status", "duration", "location", "landmark", "address", "city", "state", "zip", "last_event_date", "serial_number", "device", "battery_status"
  ];
  return rows.map((arr: any[]) => {
    const o: Row = {};
    headers.forEach((h: string, i: number) => (o[h] = arr[i]));
    return o;
  });
}

Deno.serve(async (req) => {
  try {
    const { bucket = "gps-fleetlocate", path, source_file = null } = await req.json();
    if (!path) {
      return new Response(JSON.stringify({ error: "Missing 'path' to CSV in Storage." }), { status: 400 });
    }

    const csv = await readCsvFromStorage(bucket, path);
    const rows = await parseCsv(csv);
    const inserts: any[] = [];

    for (const r of rows) {
      inserts.push({
        asset_id: r.asset_id,
        group: r.group,
        status: r.status,
        duration: r.duration,
        location: r.location,
        landmark: r.landmark,
        address: r.address,
        city: r.city,
        state: r.state,
        zip: r.zip ? parseInt(r.zip) : null,
        last_event_date: r.last_event_date,
        serial_number: r.serial_number,
        device: r.device,
        battery_status: r.battery_status,
        source_file: source_file ?? `${bucket}/${path}`
      });
    }

    if (inserts.length) {
      const { error: upErr } = await sb.from('fleetlocate_daily_asset_report').insert(inserts);
      if (upErr) throw upErr;
    }

    return new Response(JSON.stringify({ inserted: inserts.length }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500 });
  }
});
