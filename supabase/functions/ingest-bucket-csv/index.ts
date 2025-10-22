// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse as parseCsv } from "https://deno.land/std@0.224.0/csv/parse.ts";
// SheetJS for XLSX parsing
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

type Row = Record<string, any>;
type Config = {
  bucket: string;              // required
  prefix?: string;             // optional e.g. "anytrek/"
  table: string;               // required e.g. "gps_anytrek_log"
  conflictTarget?: string[];   // e.g. ["device_id","timestamp_utc"]
  batchSize?: number;          // default 500
  recursive?: boolean;         // default true
};

// --- parsing helpers (drop-in) ---
function stripBom(s: string) {
  return s.replace(/^\uFEFF/, ""); // remove BOM if present
}

function sniffDelimiter(firstChunk: string): string {
  // Excel often writes "sep=," on the first line. Respect it if present.
  const firstLine = firstChunk.split(/\r?\n/)[0] ?? "";
  const m = /^sep=(.+)\s*$/i.exec(firstLine.trim());
  if (m) return m[1]; // explicit "sep=;"
  // Otherwise choose the char that appears more often on the first few lines.
  const sample = firstChunk.split(/\r?\n/).slice(0, 5).join("\n");
  const counts = {
    ",": (sample.match(/,/g) || []).length,
    ";": (sample.match(/;/g) || []).length,
    "\t": (sample.match(/\t/g) || []).length,
    "|": (sample.match(/\|/g) || []).length,
  };
  let best = ",";
  let max = counts[best];
  for (const k of Object.keys(counts)) {
    if (counts[k as keyof typeof counts] > max) {
      max = counts[k as keyof typeof counts];
      best = k;
    }
  }
  return best;
}

async function parseTextLikeCsv(text: string): Promise<Record<string, any>[]> {
  // 1) Normalize & strip BOM
  let norm = stripBom(text).replace(/\r\n/g, "\n");

  // 2) If first line is a sep directive (even if quoted), drop it
  const lines0 = norm.split("\n");
  if (lines0.length) {
    const firstRaw = lines0[0] ?? "";
    const firstTrim = firstRaw.trim().replace(/^"+|"+$/g, ""); // remove wrapping quotes
    const m = /^sep=(.+)\s*$/i.exec(firstTrim);
    if (m) {
      lines0.shift();
      norm = lines0.join("\n");
    }
  }

  // 3) Sniff delimiter
  const sep = sniffDelimiter(norm);

  const { parse } = await import("https://deno.land/std@0.224.0/csv/parse.ts");
  let arr = await parse(norm, { skipFirstRow: false, separator: sep }) as any[];

  // 4) Fallback: if header is literally ["sep="] due to weird quoting,
  //    drop the first line and re-parse
  if (arr.length && Array.isArray(arr[0]) && arr[0].length === 1 && String(arr[0][0]).trim().toLowerCase() === "sep=,") {
    norm = norm.split("\n").slice(1).join("\n");
    arr = await parse(norm, { skipFirstRow: false, separator: sep }) as any[];
  }

  if (!arr.length) return [];

  const headers = (arr[0] as string[]).map(h => String(h ?? "").trim());
  return arr.slice(1).map((row: any[]) => {
    const o: Record<string, any> = {};
    headers.forEach((h, i) => o[h] = row[i]);
    return o;
  });
}

async function parseFile(obj: Blob, path: string): Promise<Record<string, any>[]> {
  if (/\.xlsx?$/i.test(path)) {
    const XLSX = await import("https://esm.sh/xlsx@0.18.5");
    const ab = await obj.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null }) as Record<string, any>[];
  }
  // Treat everything else as CSV-like text
  const text = await obj.text();
  return parseTextLikeCsv(text);
}

function getByKeys(o: Record<string,any>, names: string[]): any {
  const keys = Object.keys(o);
  for (const n of names) {
    const hit = keys.find(k => k.toLowerCase().trim() === n.toLowerCase().trim());
    if (hit) return o[hit];
  }
  return undefined;
}
function parseNum(v: any): number | null {
  if (v == null) return null;
  const n = Number(String(v).trim().replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function parseTimestamp(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // normalize a couple common forms; Postgres can parse the rest
  if (/^\d{4}-\d{2}-\d{2} \d\d:\d\d:\d\d$/.test(s)) return s.replace(" ", "T") + "Z";
  if (/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(\.\d+)?Z?$/.test(s)) return s.endsWith("Z") ? s : s + "Z";
  if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}(:\d{2})? ?[AP]M$/i.test(s)) return s;
  return s;
}
function splitLatLonCombo(s: any): {lat: number|null, lon: number|null} {
  if (!s) return { lat: null, lon: null };
  const parts = String(s).split(",").map(p => p.trim());
  if (parts.length !== 2) return { lat: null, lon: null };
  return { lat: parseNum(parts[0]), lon: parseNum(parts[1]) };
}

function mapBlackberryRow(r: Record<string,any>, sourcePath: string) {
  const device = getByKeys(r, ["Device ID","DeviceId","Serial Number","Device","device_id"]);
  const tsRaw = getByKeys(r, [
    "Timestamp (UTC)","Time (UTC)","Event Time","Date/Time (UTC)","Date Time UTC",
    "timestamp_utc","timestamp"
  ]);
  const ts = parseTimestamp(tsRaw);

  let lat = parseNum(getByKeys(r, ["Latitude","latitude","Lat"]));
  let lon = parseNum(getByKeys(r, ["Longitude","longitude","Lon","Long"]));
  if (lat == null || lon == null) {
    const combo = getByKeys(r, ["Latitude, Longitude","latitude, longitude","Lat, Long","lat, lon", "Latitude , Longitude","Latitude ,  Longitude","Lat , Long"]);
    const sp = splitLatLonCombo(combo);
    lat = lat ?? sp.lat;
    lon = lon ?? sp.lon;
  }

  if (!device || !ts || lat == null || lon == null) return null;

  const speedKph = parseNum(getByKeys(r, ["Speed (km/h)","Speed KPH","Speed"]));
  const heading  = parseNum(getByKeys(r, ["Heading","Course"]));
  const battery  = parseNum(getByKeys(r, ["Battery","Battery %"]));
  const label    = getByKeys(r, ["Location","Address","Place"]);

  return {
    provider: "blackberry",
    device_id: String(device),
    timestamp_utc: ts,
    latitude: lat,
    longitude: lon,
    speed_kph: speedKph ?? null,
    heading: heading ?? null,
    battery_pct: battery ?? null,
    location_label: label ?? null,
    formatted_address: null,
    place_id: null,
    source_file: sourcePath,
    raw: r
  };
}

type MapperChoice = "anytrek" | "blackberry";

function chooseMapper(mapper: MapperChoice) {
  return mapper === "blackberry" ? mapBlackberryRow : mapAnytrekRow;
}

async function download(bucket: string, path: string) {
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}

async function insertBatches(table: string, rows: Row[], batchSize = 500, conflictTarget?: string[]) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await sb.from(table).upsert(chunk, {
      onConflict: conflictTarget?.join(","),
      defaultToNull: true,
    });
    if (error) throw error;
  }
}

async function listAll(bucket: string, prefix = "", recursive = true) {
  const out: string[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, {
      limit, offset: (page - 1) * limit, sortBy: { column: "name", order: "asc" }
    });
    if (error) throw error;
    if (!data?.length) break;
    for (const it of data) {
      if (it.name.endsWith("/")) {
        if (recursive) {
          const child = (prefix ? `${prefix}/` : "") + it.name.replace(/\/$/, "");
          const sub = await listAll(bucket, child, recursive);
          out.push(...sub);
        }
      } else {
        const path = prefix ? `${prefix}/${it.name}` : it.name;
        if (/\.(csv|xlsx)$/i.test(path)) out.push(path);
      }
    }
    if (data.length < limit) break;
    page++;
  }
  return out;
}

function summarizeRow(r: Record<string, any>, maxKeys = 12, maxVal = 80) {
  const out: Record<string, string> = {};
  for (const k of Object.keys(r).slice(0, maxKeys)) {
    const v = String(r[k] ?? "");
    out[k] = v.length > maxVal ? v.slice(0, maxVal) + "…" : v;
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const cfg = await req.json() as {
      bucket: string; prefix?: string; table: string;
      conflictTarget?: string[]; batchSize?: number; recursive?: boolean;
      mapper?: MapperChoice;
      debug?: boolean;
    };
    if (!cfg.bucket || !cfg.table) {
      return new Response(JSON.stringify({ error: "Missing 'bucket' or 'table'." }), { status: 400 });
    }
    const mapFn = chooseMapper(cfg.mapper ?? "blackberry");

    const files = await listAll(cfg.bucket, cfg.prefix, cfg.recursive);
    let total = 0;

    for (const path of files) {
      const blob = await download(cfg.bucket, path);
      const rawRows = await parseFile(blob, path);
      const mapped = rawRows
        .map(r => mapFn(r, `${cfg.bucket}/${path}`))
        .filter((x): x is Record<string,any> => !!x);

      if (cfg.debug && !mapped.length) {
        const first = rawRows[0] ?? null;
        const headersDetected = first ? Object.keys(first) : [];
        return new Response(JSON.stringify({
          note: "No mapped rows for this file; echoing just headers + 1 summarized row.",
          file: `${cfg.bucket}/${path}`,
          headersDetected,
          sampleRow: first ? summarizeRow(first) : null
        }), { headers: { "content-type": "application/json" }, status: 200 });
      }

      if (mapped.length) {
        await insertBatches(cfg.table, mapped, cfg.batchSize, cfg.conflictTarget);
        total += mapped.length;
      }
    }

    return new Response(JSON.stringify({ files: files.length, inserted: total }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500 });
  }
});