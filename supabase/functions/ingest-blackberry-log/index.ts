// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

type Row = Record<string, any>;

function normalizeHeader(h: string) {
  return String(h).trim().replace(/\s+/g, " ").toLowerCase();
}

function pick<T extends Record<string, any>>(o: T, keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (v != null && v !== "") return v;
  }
  return null;
}

function parseLatLng(row: Row) {
  // Normalize keys to handle slight header variations
  const keys = Object.keys(row);
  const map: Record<string,string> = {};
  for (const k of keys) map[normalizeHeader(k)] = k;

  const combinedKey =
    map["latitude, longitude"] ??
    map["lat, long"] ??
    map["lat,long"] ??
    map["location (lat, long)"] ??
    null;

  let lat = pick(row, [
    map["latitude"], map["lat"]
  ]);
  let lng = pick(row, [
    map["longitude"], map["lon"], map["long"], map["lng"]
  ]);

  if (combinedKey && (lat == null || lng == null)) {
    const combined = String(row[combinedKey]);
    const parts = combined.split(",").map((s: string) => s.trim());
    if (parts.length === 2) { lat = parts[0]; lng = parts[1]; }
  }

  const latNum = Number(String(lat).replace(/[^\d\.\-]/g, ""));
  const lngNum = Number(String(lng).replace(/[^\d\.\-]/g, ""));
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    return { latitude: latNum, longitude: lngNum };
  }
  return { latitude: null, longitude: null };
}

function getDeviceId(row: Row) {
  const keys = Object.keys(row);
  const map: Record<string,string> = {};
  for (const k of keys) map[normalizeHeader(k)] = k;
  return pick(row, [
    map["device id"], map["deviceid"], map["serial number"], map["device"],
    map["asset id"], map["equipment id"], map["tracker id"], map["imei"], map["device_id"],
    map["asset"]
  ]);
}

function getTimestampUtc(row: Row) {
  const keys = Object.keys(row);
  const map: Record<string,string> = {};
  for (const k of keys) map[normalizeHeader(k)] = k;

  const v = pick(row, [
    map["timestamp (utc)"],
    map["time (utc)"],
    map["event time"],
    map["date/time (utc)"],
    map["date time utc"],
    map["utc timestamp"],
    map["timestamp utc"],
    map["time"],
    map["timestamp"],
    map["event timestamp (utc)"],
    map["location last update"]
  ]);
  return v ? new Date(String(v)).toISOString() : null;
}

function numOrNull(v: any) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^\d\.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function reverseGeocode(lat: number, lng: number) {
  if (!GOOGLE_MAPS_API_KEY) return { formatted_address: null, place_id: null };
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
  const res = await fetch(url.toString());
  if (!res.ok) return { formatted_address: null, place_id: null };
  const j = await res.json();
  const r = j?.results?.[0];
  return { formatted_address: r?.formatted_address ?? null, place_id: r?.place_id ?? null };
}

async function readCsvFromStorage(bucket: string, path: string) {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw error;
  return await data.text();
}

async function parseCsv(text: string): Promise<Row[]> {
  const { parse } = await import("https://deno.land/std@0.224.0/csv/parse.ts");
  let rows = await parse(text, { skipFirstRow: false }) as any[];
  if (!rows.length) return [];

  if (rows[0].length === 1 && rows[0][0].startsWith('sep=')) {
    rows = rows.slice(1);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h: string) => String(h));
  return rows.slice(1).map((arr: any[]) => {
    const o: Row = {};
    headers.forEach((h: string, i: number) => (o[h] = arr[i]));
    return o;
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { bucket = "gps-uploads", path, source_file = null, dry_run = false } = payload;
    if (!path) return new Response(JSON.stringify({ error: "Missing 'path' to CSV in Storage." }), { status: 400 });

    const csv = await readCsvFromStorage(bucket, path);
    const rows = await parseCsv(csv);

    const diagnostics = {
      total_rows_in_csv: rows.length,
      sample_headers: rows[0] ? Object.keys(rows[0]).slice(0, 25) : [],
      skipped_missing_device: 0,
      skipped_missing_timestamp: 0,
      skipped_missing_latlng: 0,
      first_5_kept: [] as any[]
    };

    const inserts: any[] = [];
    for (const r of rows) {
      const device_id = getDeviceId(r);
      if (!device_id) { diagnostics.skipped_missing_device++; continue; }

      const timestamp_utc = getTimestampUtc(r);
      if (!timestamp_utc) { diagnostics.skipped_missing_timestamp++; continue; }

      const { latitude, longitude } = parseLatLng(r);
      if (latitude == null || longitude == null) { diagnostics.skipped_missing_latlng++; continue; }

      const speed_kph   = numOrNull(r["Speed (km/h)"] ?? r["Speed KPH"] ?? r["Speed"]);
      const heading     = numOrNull(r["Heading"] ?? r["Course"]);
      const battery_pct = numOrNull(r["Battery"] ?? r["Battery %"]);
      const location_label = r["Location"] ?? r["Address"] ?? null;

      let formatted_address: string | null = null;
      let place_id: string | null = null;
      try {
        const geocode = await reverseGeocode(latitude, longitude);
        formatted_address = geocode.formatted_address;
        place_id = geocode.place_id;
      } catch { /* ignore geocode errors */ }

      const rowObj = {
        device_id,
        timestamp_utc,
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        speed_kph,
        heading,
        battery_pct,
        location_label,
        formatted_address,
        place_id,
        source_file: source_file ?? `${bucket}/${path}`
      };

      if (diagnostics.first_5_kept.length < 5) {
        diagnostics.first_5_kept.push(rowObj);
      }
      inserts.push(rowObj);
    }

    if (dry_run) {
      return new Response(JSON.stringify({ dry_run: true, diagnostics, would_insert: inserts.length }), {
        headers: { "content-type": "application/json" }
      });
    }

    if (inserts.length) {
      const { error: upErr } = await sb.from('GPS_Blackberry_Log').insert(inserts);
      if (upErr) throw upErr;
    }

    return new Response(JSON.stringify({
      inserted: inserts.length,
      diagnostics: inserts.length === 0 ? diagnostics : undefined
    }), { headers: { "content-type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500 });
  }
});