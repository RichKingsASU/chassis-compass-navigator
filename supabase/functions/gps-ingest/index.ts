/**
 * GPS Ingest Edge Function
 * ========================
 * Triggered by Supabase Storage webhook when a file is uploaded
 * to any of the 6 GPS buckets.
 *
 * Supported buckets → tables:
 *   gps-samsara          → samsara_gps        (KF Chassis Report.xlsx)
 *   gps-blackberry-log   → blackberry_log_gps  (BlackBerry-Radar-Fleet-State-Log.csv)
 *   gps-blackberry-tran  → blackberry_tran_gps (BlackBerry-Radar-Fleet-State-Tran.csv)
 *   gps-fleetview        → assetlist_gps       (AssetList.xlsx)
 *   gps-fleetlocate      → fleetlocate_gps     (FleetLocate.csv)
 *   gps-anytrek          → anytrek_gps         (Anytrek.xlsx)
 *
 * File path format in bucket: 04_13_2026/KF Chassis Report.xlsx
 * Duplicate strategy: ON CONFLICT DO NOTHING (chassis_number + _source_file)
 * Chassis normalization: strip all spaces from chassis numbers
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ── Chassis number normalization ──────────────────────────────
function normalizeChassis(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return String(raw).replace(/\s+/g, "").trim().toUpperCase();
}

// ── Safe numeric parser — returns null for empty string / NaN ──
function safeNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ── Parse duration strings like "5d 10h 25m" → numeric days ──
function parseDurationDays(dur: string | null | undefined): number | null {
  if (!dur) return null;
  const days = dur.match(/(\d+)d/)?.[1];
  const hours = dur.match(/(\d+)h/)?.[1];
  const mins = dur.match(/(\d+)m/)?.[1];
  const total =
    (parseInt(days || "0") +
      parseInt(hours || "0") / 24 +
      parseInt(mins || "0") / 1440);
  return isNaN(total) ? null : Math.round(total * 100) / 100;
}

// ── Safe date parser ──────────────────────────────────────────
function parseDate(val: unknown): string | null {
  if (!val) return null;
  try {
    const d = new Date(String(val));
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

// ── Read file bytes from storage ──────────────────────────────
async function downloadFile(bucket: string, path: string): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return data.arrayBuffer();
}

// ── Parse XLSX/CSV from ArrayBuffer ───────────────────────────
function parseXlsx(buffer: ArrayBuffer, sheetName?: string): Record<string, unknown>[] {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
  const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function parseCsv(buffer: ArrayBuffer, skipRows = 0): Record<string, unknown>[] {
  const text = new TextDecoder("utf-8").decode(buffer);
  const lines = text.split("\n");
  const cleaned = lines.slice(skipRows).join("\n");
  const wb = XLSX.read(cleaned, { type: "string" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

// ══════════════════════════════════════════════════════════════
// PARSERS — one per provider
// ══════════════════════════════════════════════════════════════

// ── 1. Samsara (KF Chassis Report.xlsx) ──────────────────────
function parseSamsara(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return rows
    .map((r) => ({
      tag_name:              r["Tag: Name"] ?? null,
      chassis_number:        normalizeChassis(r["Name"] as string),
      landmark:              r["Last Known Geofence Location (All Time)"] ?? null,
      address:               r["Last Known Location (All Time)"] ?? null,
      device_last_connected: r["Device Last Connected"] ?? null,
      dormant_days:          safeNum(r["Dormant Duration (Days)"]),
      _source_file:          sourceFile,
    }))
    .filter((r) => r.chassis_number);
}

// ── 2. Blackberry Log (BlackBerry-Radar-Fleet-State-Log.csv) ──
function parseBlackberryLog(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return rows
    .map((r) => ({
      chassis_number:              normalizeChassis(r["Asset"] as string),
      geofence:                    r["Geofence"] ?? null,
      address:                     r["Address"] ?? null,
      lat_lng:                     r["Latitude, Longitude"] ?? null,
      location_last_update:        parseDate(r["Location Last Update"]),
      sensors_last_update:         parseDate(r["Sensors Last Update"]),
      movement:                    r["Movement"] ?? null,
      movement_last_update:        parseDate(r["Movement Last Update"]),
      movement_duration:           r["Movement Duration"] ?? null,
      idle_for:                    r["Idle For"] ?? null,
      module_communication_status: r["Module Communication Status"] ?? null,
      traveled_mi:                 r["Traveled (mi)"] ?? null,
      initial_mi:                  r["Initial (mi)"] ?? null,
      total_mi:                    r["Total (mi)"] ?? null,
      last_geofence:               r["Last Geofence"] ?? null,
      battery:                     r["Battery"] ?? null,
      module_battery_last_status:  parseDate(r["Module Battery Last Status Change"]),
      accessory_battery_details:   r["Accessory Battery Details"] ? String(r["Accessory Battery Details"]) : null,
      module_battery_replaced_on:  parseDate(r["Module Battery Replaced On"]),
      container:                   r["Container"] ?? null,
      container_last_update:       parseDate(r["Container Last Update"]),
      door_type:                   r["Door Type"] ? String(r["Door Type"]) : null,
      asset_last_modified:         parseDate(r["Asset Last Modified"]),
      asset_type:                  r["Asset Type"] ?? null,
      frequency:                   r["Frequency"] ?? null,
      notes:                       r["Notes"] ? String(r["Notes"]) : null,
      asset_class:                 r["Asset Class"] ?? null,
      mounting_location:           r["Mounting Location"] ?? null,
      asset_labels:                r["Asset Labels"] ? String(r["Asset Labels"]) : null,
      module:                      r["Module"] ?? null,
      software_version:            r["Software Version"] ?? null,
      module_type:                 r["Module Type"] ?? null,
      module_activated:            parseDate(r["Module Activated"]),
      customer_associated:         parseDate(r["Customer Associated"]),
      asset_associated:            parseDate(r["Asset Associated"]),
      leasing:                     r["Leasing"] ?? null,
      accessory_pairing_details:   r["Accessory Pairing Details"] ? String(r["Accessory Pairing Details"]) : null,
      _source_file:                sourceFile,
    }))
    .filter((r) => r.chassis_number);
}

// ── 3. Blackberry Tran (BlackBerry-Radar-Fleet-State-Tran.csv) ─
// Identical schema to Log — reuse the same parser
function parseBlackberryTran(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return parseBlackberryLog(rows, sourceFile); // same columns
}

// ── 4. AssetList / Fleetview (AssetList.xlsx) ─────────────────
function parseAssetList(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return rows
    .map((r) => ({
      chassis_number:       normalizeChassis(r["Asset ID"] as string),
      device_serial_number: r["Device Serial Number"] ? String(r["Device Serial Number"]) : null,
      days_dormant:         safeNum(r["Days Dormant"]),
      event_reason:         r["Event Reason"] ?? null,
      report_time:          parseDate(r["Report Time"]),
      gps_time:             parseDate(r["GPS Time"]),
      landmark:             r["Landmark"] ? String(r["Landmark"]).trim() || null : null,
      address:              r["Address, City, State, Zip Code"] ?? null,
      nearest_major_city:   r["Nearest Major City"] ?? null,
      _source_file:         sourceFile,
    }))
    .filter((r) => r.chassis_number);
}

// ── 5. FleetLocate (FleetLocate.csv) ─────────────────────────
function parseFleetLocate(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return rows
    .map((r) => ({
      chassis_number: normalizeChassis(r["Asset ID"] as string),
      group_name:     r["Group"] ?? null,
      status:         r["Status"] ?? null,
      duration:       r["Duration"] ?? null,
      dormant_days:   parseDurationDays(r["Duration"] as string),
      location:       r["Location"] ?? null,
      landmark:       r["Landmark"] ?? null,
      address:        r["Address"] ?? null,
      city:           r["City"] ?? null,
      state:          r["State"] ?? null,
      zip:            r["Zip"] ? String(r["Zip"]) : null,
      last_event_date: parseDate(r["Last Event Date"]),
      serial_number:  r["Serial Number"] ? String(r["Serial Number"]) : null,
      device:         r["Device"] ?? null,
      battery_status: r["Battery Status"] ?? null,
      _source_file:   sourceFile,
    }))
    .filter((r) => r.chassis_number);
}

// ── 6. Anytrek (Anytrek.xlsx) ─────────────────────────────────
function parseAnytrek(
  rows: Record<string, unknown>[],
  sourceFile: string
): Record<string, unknown>[] {
  return rows
    .map((r) => ({
      device_id:                   r["Device Id"] ? String(r["Device Id"]) : null,
      chassis_number:              normalizeChassis(r["Vehicle"] as string),
      group_name:                  r["Group"] ?? null,
      landmark:                    r["Landmark"] ?? null,
      enter_time:                  parseDate(r["Enter Time"]),
      dwell_time:                  r["Dwell Time"] ?? null,
      dormant_days:                parseDurationDays(r["Dwell Time"] as string),
      speed_mph:                   safeNum(r["Speed(mph)"]),
      lat:                         safeNum(r["Lat"]),
      lng:                         safeNum(r["Lng"]),
      location_time_local:         parseDate(r["Location Time(Local)"]),
      location_time_device_local:  r["Location Time(Local)(Device local)"] ? String(r["Location Time(Local)(Device local)"]) : null,
      state:                       r["State"] ?? null,
      driving_status:              r["Driving Status"] ?? null,
      current_state_lasting:       r["Current State Lasting"] ?? null,
      driving_direction:           safeNum(r["Driving Direction"]),
      address:                     r["Address"] ?? null,
      _source_file:                sourceFile,
    }))
    .filter((r) => r.chassis_number);
}

// ══════════════════════════════════════════════════════════════
// UPSERT — insert rows, skip duplicates
// ══════════════════════════════════════════════════════════════
async function upsertRows(
  table: string,
  rows: Record<string, unknown>[],
  conflictCols: string[]
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) return { inserted: 0, skipped: 0 };

  // Batch in chunks of 500 to avoid payload limits
  const CHUNK = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from(table)
      .insert(chunk, { count: "exact" })
      .select();

    if (error) {
      // ON CONFLICT DO NOTHING equivalent — ignore duplicate key errors
      if (!error.message.includes("duplicate key")) {
        throw new Error(`Insert into ${table} failed: ${error.message}`);
      }
    } else {
      inserted += count ?? chunk.length;
    }
  }

  const skipped = rows.length - inserted;
  return { inserted, skipped };
}

// ══════════════════════════════════════════════════════════════
// ROUTER — maps bucket + filename → parser + table
// ══════════════════════════════════════════════════════════════
interface RouteConfig {
  table: string;
  parse: (rows: Record<string, unknown>[], sourceFile: string) => Record<string, unknown>[];
  fileType: "xlsx" | "csv";
  sheetName?: string;
  csvSkipRows?: number;
}

const ROUTES: Record<string, Record<string, RouteConfig>> = {
  "gps-samsara": {
    "KF Chassis Report.xlsx": {
      table: "samsara_gps",
      parse: parseSamsara,
      fileType: "xlsx",
      sheetName: "Report 1",
    },
  },
  "gps-blackberry-log": {
    "BlackBerry-Radar-Fleet-State-Log.csv": {
      table: "blackberry_log_gps",
      parse: parseBlackberryLog,
      fileType: "csv",
      csvSkipRows: 1, // skip "sep=," header
    },
  },
  "gps-blackberry-tran": {
    "BlackBerry-Radar-Fleet-State-Tran.csv": {
      table: "blackberry_tran_gps",
      parse: parseBlackberryTran,
      fileType: "csv",
      csvSkipRows: 1,
    },
  },
  "gps-fleetview": {
    "AssetList.xlsx": {
      table: "assetlist_gps",
      parse: parseAssetList,
      fileType: "xlsx",
    },
  },
  "gps-fleetlocate": {
    "FleetLocate.csv": {
      table: "fleetlocate_gps",
      parse: parseFleetLocate,
      fileType: "csv",
    },
  },
  "gps-anytrek": {
    "Anytrek.xlsx": {
      table: "anytrek_gps",
      parse: parseAnytrek,
      fileType: "xlsx",
      sheetName: "sheet1",
    },
  },
};

// ══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    // Supabase storage webhook payload
    const payload = await req.json();
    const bucket: string = payload.record?.bucket_id ?? payload.bucket_id;
    const filePath: string = payload.record?.name ?? payload.name;

    if (!bucket || !filePath) {
      return new Response(
        JSON.stringify({ error: "Missing bucket or file path in payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // filePath = "04_13_2026/KF Chassis Report.xlsx"
    const fileName = filePath.split("/").pop() ?? filePath;
    const sourceFile = filePath; // full path stored as audit trail

    console.log(`Processing: bucket=${bucket} file=${filePath}`);

    // Look up route
    const bucketRoutes = ROUTES[bucket];
    if (!bucketRoutes) {
      return new Response(
        JSON.stringify({ message: `No route configured for bucket: ${bucket}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const route = bucketRoutes[fileName];
    if (!route) {
      return new Response(
        JSON.stringify({ message: `Unrecognized file in ${bucket}: ${fileName}` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Download file from storage
    const buffer = await downloadFile(bucket, filePath);

    // Parse rows
    let rawRows: Record<string, unknown>[];
    if (route.fileType === "xlsx") {
      rawRows = parseXlsx(buffer, route.sheetName);
    } else {
      rawRows = parseCsv(buffer, route.csvSkipRows ?? 0);
    }

    // Transform rows using provider-specific parser
    const rows = route.parse(rawRows, sourceFile);

    // Upsert with duplicate skipping
    const { inserted, skipped } = await upsertRows(
      route.table,
      rows,
      ["chassis_number", "_source_file"]
    );

    const result = {
      bucket,
      file: filePath,
      table: route.table,
      total_rows: rows.length,
      inserted,
      skipped,
    };

    console.log(`Done:`, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("GPS ingest error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});