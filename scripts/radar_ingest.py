#!/usr/bin/env python3
"""
BlackBerry Radar → Supabase Ingestion Pipeline

Behaviour:
  • First run  – pulls ALL historical data (up to the max window from discovery)
  • Later runs – pulls only new data since last_synced_at (incremental sync)
  • For each asset: location history, event history, sensor readings
  • Upserts into Supabase (ON CONFLICT … DO UPDATE) — no duplicates, no skips
  • Writes progress to radar_sync_log after each table completes
  • Retries transient errors (429, 503) with exponential back-off
  • Prints a summary when done

Usage:
    python scripts/radar_ingest.py              # normal run
    python scripts/radar_ingest.py --full       # force full historical pull

Requires env vars (see .env.example):
    RADAR_API_BASE_URL, RADAR_API_KEY,
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import asyncio
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)
from tqdm import tqdm
import logging

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("radar_ingest")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = os.getenv("RADAR_API_BASE_URL", "").rstrip("/")
API_KEY = os.getenv("RADAR_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

PAGE_SIZE = int(os.getenv("RADAR_PAGE_SIZE", "100"))
MAX_HISTORY_DAYS = int(os.getenv("RADAR_MAX_HISTORY_DAYS", "365"))
BATCH_UPSERT_SIZE = int(os.getenv("RADAR_BATCH_SIZE", "500"))

REPORT_DIR = Path(__file__).resolve().parent.parent / "reports"


# ---------------------------------------------------------------------------
# Custom transient-error exception for retry logic
# ---------------------------------------------------------------------------
class TransientAPIError(Exception):
    """Raised on 429 / 503 so tenacity can retry."""

    def __init__(self, status_code: int, detail: str = ""):
        self.status_code = status_code
        super().__init__(f"HTTP {status_code}: {detail}")


class AuthError(Exception):
    """Raised on 401/403 — stop and notify the user."""
    pass


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------
def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json",
    }


@retry(
    retry=retry_if_exception_type(TransientAPIError),
    wait=wait_exponential(multiplier=2, min=2, max=60),
    stop=stop_after_attempt(6),
    before_sleep=before_sleep_log(log, logging.WARNING),
    reraise=True,
)
async def _get(client: httpx.AsyncClient, path: str, params: dict | None = None) -> dict | list:
    """GET with automatic retry on 429/503."""
    url = f"{BASE_URL}{path}" if not path.startswith("http") else path
    resp = await client.get(url, headers=_headers(), params=params or {})

    if resp.status_code in (429, 503):
        retry_after = resp.headers.get("Retry-After", "")
        raise TransientAPIError(resp.status_code, f"Retry-After: {retry_after}")

    if resp.status_code in (401, 403):
        raise AuthError(
            f"HTTP {resp.status_code} — Check your RADAR_API_KEY.\n"
            "Ensure the key is valid and has read permissions for the Radar API."
        )

    if resp.status_code == 404:
        log.warning("404 for %s — skipping", url)
        return []

    resp.raise_for_status()

    if "json" in resp.headers.get("content-type", ""):
        return resp.json()
    return []


async def _paginate(
    client: httpx.AsyncClient,
    path: str,
    params: dict | None = None,
    data_key: str | None = None,
) -> list[dict]:
    """Fetch all pages from a paginated endpoint."""
    params = dict(params or {})
    params.setdefault("limit", PAGE_SIZE)
    params.setdefault("page_size", PAGE_SIZE)

    all_records: list[dict] = []
    offset = 0
    page = 1

    while True:
        params["offset"] = offset
        params["page"] = page

        body = await _get(client, path, params)

        # Extract records from response
        if isinstance(body, list):
            records = body
        elif isinstance(body, dict):
            # Try common data wrapper keys
            records = None
            for key in (data_key, "data", "results", "items", "records", "assets",
                        "locations", "events", "readings", "sensors"):
                if key and key in body and isinstance(body[key], list):
                    records = body[key]
                    break
            if records is None:
                # Maybe the dict itself is the single record
                records = [body] if body else []
        else:
            break

        if not records:
            break

        all_records.extend(records)

        # Check for end-of-data signals
        if len(records) < PAGE_SIZE:
            break

        # Cursor-based pagination
        if isinstance(body, dict):
            next_cursor = None
            for key in ["next_cursor", "cursor", "nextCursor", "next_page_token", "nextPageToken"]:
                if key in body and body[key]:
                    next_cursor = body[key]
                    break
            if next_cursor:
                params["cursor"] = next_cursor
                params["after"] = next_cursor
            else:
                offset += len(records)
                page += 1
        else:
            offset += len(records)
            page += 1

    return all_records


# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------
def get_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert_batch(sb: Client, table: str, rows: list[dict], conflict_columns: str) -> int:
    """Upsert rows in batches. Returns total upserted count."""
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), BATCH_UPSERT_SIZE):
        batch = rows[i : i + BATCH_UPSERT_SIZE]
        sb.table(table).upsert(batch, on_conflict=conflict_columns).execute()
        total += len(batch)
    return total


def get_last_synced(sb: Client, table_name: str) -> datetime | None:
    """Get last_synced_at from radar_sync_log for a given table."""
    resp = (
        sb.table("radar_sync_log")
        .select("last_synced_at")
        .eq("table_name", table_name)
        .is_("radar_asset_id", "null")
        .order("last_synced_at", desc=True)
        .limit(1)
        .execute()
    )
    if resp.data:
        ts = resp.data[0]["last_synced_at"]
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    return None


def write_sync_log(
    sb: Client,
    table_name: str,
    last_synced: datetime,
    records_synced: int,
    status: str = "completed",
    error_message: str | None = None,
    duration: float = 0.0,
):
    """Write or update sync_log entry."""
    sb.table("radar_sync_log").upsert(
        {
            "table_name": table_name,
            "radar_asset_id": None,
            "last_synced_at": last_synced.isoformat(),
            "records_synced": records_synced,
            "status": status,
            "error_message": error_message,
            "duration_seconds": round(duration, 2),
        },
        on_conflict="table_name,COALESCE(radar_asset_id, '__global__')",
    ).execute()


# ---------------------------------------------------------------------------
# Data extraction helpers
# ---------------------------------------------------------------------------
def _ts(val) -> str | None:
    """Normalise a timestamp value to ISO-8601 UTC string."""
    if not val:
        return None
    if isinstance(val, (int, float)):
        return datetime.fromtimestamp(val, tz=timezone.utc).isoformat()
    s = str(val)
    # Ensure timezone-aware
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return s


def _float(val) -> float | None:
    try:
        return float(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def _str(val) -> str | None:
    return str(val) if val is not None else None


def extract_asset(raw: dict) -> dict:
    """Map raw API asset to radar_assets row."""
    return {
        "radar_asset_id": str(raw.get("id") or raw.get("assetId") or raw.get("asset_id", "")),
        "asset_name": _str(raw.get("name") or raw.get("assetName") or raw.get("asset_name")),
        "asset_type": _str(raw.get("type") or raw.get("assetType") or raw.get("asset_type")),
        "device_serial": _str(raw.get("deviceSerial") or raw.get("device_serial") or raw.get("serialNumber")),
        "device_type": _str(raw.get("deviceType") or raw.get("device_type")),
        "organization_id": _str(raw.get("organizationId") or raw.get("organization_id") or raw.get("orgId")),
        "status": _str(raw.get("status", "active")),
        "metadata": json.dumps({k: v for k, v in raw.items() if k not in
                                 {"id", "assetId", "asset_id", "name", "assetName", "asset_name",
                                  "type", "assetType", "asset_type", "deviceSerial", "device_serial",
                                  "serialNumber", "deviceType", "device_type",
                                  "organizationId", "organization_id", "orgId", "status"}},
                                default=str),
        "first_seen_at": _ts(raw.get("createdAt") or raw.get("created_at") or raw.get("firstSeen")),
        "last_seen_at": _ts(raw.get("lastSeen") or raw.get("last_seen") or raw.get("updatedAt")),
    }


def extract_location(raw: dict, asset_id: str) -> dict:
    """Map raw location record to radar_asset_locations row."""
    return {
        "radar_asset_id": asset_id,
        "latitude": _float(raw.get("latitude") or raw.get("lat")),
        "longitude": _float(raw.get("longitude") or raw.get("lng") or raw.get("lon")),
        "altitude": _float(raw.get("altitude") or raw.get("alt")),
        "speed": _float(raw.get("speed")),
        "heading": _float(raw.get("heading") or raw.get("bearing")),
        "accuracy": _float(raw.get("accuracy") or raw.get("hdop")),
        "address": _str(raw.get("address") or raw.get("formattedAddress") or raw.get("location_name")),
        "geofence_name": _str(raw.get("geofence") or raw.get("geofenceName") or raw.get("geofence_name")),
        "recorded_at": _ts(
            raw.get("timestamp") or raw.get("recordedAt") or raw.get("recorded_at") or raw.get("time")
        ),
        "raw_data": json.dumps(raw, default=str),
    }


def extract_event(raw: dict, asset_id: str) -> dict:
    """Map raw event record to radar_asset_events row."""
    return {
        "radar_asset_id": asset_id,
        "event_type": _str(raw.get("type") or raw.get("eventType") or raw.get("event_type", "unknown")),
        "event_description": _str(raw.get("description") or raw.get("message") or raw.get("details")),
        "latitude": _float(raw.get("latitude") or raw.get("lat")),
        "longitude": _float(raw.get("longitude") or raw.get("lng") or raw.get("lon")),
        "recorded_at": _ts(
            raw.get("timestamp") or raw.get("recordedAt") or raw.get("recorded_at") or raw.get("time")
        ),
        "raw_data": json.dumps(raw, default=str),
    }


def extract_sensor(raw: dict, asset_id: str) -> dict:
    """Map raw sensor reading to radar_sensor_readings row."""
    return {
        "radar_asset_id": asset_id,
        "sensor_type": _str(raw.get("type") or raw.get("sensorType") or raw.get("sensor_type", "unknown")),
        "sensor_value": _float(raw.get("value") or raw.get("reading")),
        "unit": _str(raw.get("unit") or raw.get("units")),
        "recorded_at": _ts(
            raw.get("timestamp") or raw.get("recordedAt") or raw.get("recorded_at") or raw.get("time")
        ),
        "raw_data": json.dumps(raw, default=str),
    }


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------
async def ingest(force_full: bool = False):
    """Run the full ingestion pipeline."""
    t0 = time.time()
    print("=" * 70)
    print("  BlackBerry Radar → Supabase Ingestion Pipeline")
    print("=" * 70)

    # Validate env
    missing = []
    if not BASE_URL:
        missing.append("RADAR_API_BASE_URL")
    if not API_KEY:
        missing.append("RADAR_API_KEY")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        log.error("Missing environment variables: %s", ", ".join(missing))
        log.error("Copy .env.example to .env and fill in the values.")
        sys.exit(1)

    sb = get_supabase()
    now = datetime.now(timezone.utc)
    errors: list[dict] = []

    # Determine sync window
    sync_mode = "full"
    since: datetime | None = None
    if not force_full:
        since = get_last_synced(sb, "radar_asset_locations")
        if since:
            sync_mode = "incremental"

    if sync_mode == "full":
        since = now - timedelta(days=MAX_HISTORY_DAYS)
        log.info("FULL SYNC — pulling %d days of history", MAX_HISTORY_DAYS)
    else:
        log.info("INCREMENTAL SYNC — pulling since %s", since.isoformat())

    stats = {
        "sync_mode": sync_mode,
        "since": since.isoformat() if since else None,
        "assets": 0,
        "locations": 0,
        "events": 0,
        "sensor_readings": 0,
        "errors": [],
        "zero_record_assets": [],
    }

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        # ---- Step 1: Fetch all assets ----
        log.info("Fetching asset list...")
        try:
            raw_assets = await _paginate(client, "/assets", data_key="assets")
        except AuthError as e:
            log.error(str(e))
            sys.exit(1)
        except Exception as e:
            log.error("Failed to fetch assets: %s", e)
            sys.exit(1)

        if not raw_assets:
            log.warning("No assets returned from API. Check your credentials and base URL.")
            sys.exit(0)

        asset_rows = [extract_asset(a) for a in raw_assets]
        asset_rows = [r for r in asset_rows if r["radar_asset_id"]]
        stats["assets"] = len(asset_rows)
        log.info("Found %d assets", len(asset_rows))

        # Upsert assets
        upsert_batch(sb, "radar_assets", asset_rows, "radar_asset_id")
        log.info("Upserted %d assets into radar_assets", len(asset_rows))

        # ---- Step 2: For each asset, pull locations, events, sensors ----
        asset_ids = [r["radar_asset_id"] for r in asset_rows]

        date_params = {
            "start_date": since.strftime("%Y-%m-%dT%H:%M:%SZ") if since else None,
            "end_date": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "from": since.strftime("%Y-%m-%dT%H:%M:%SZ") if since else None,
            "to": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "since": since.strftime("%Y-%m-%dT%H:%M:%SZ") if since else None,
        }
        # Remove None params
        date_params = {k: v for k, v in date_params.items() if v}

        all_locations: list[dict] = []
        all_events: list[dict] = []
        all_sensors: list[dict] = []

        pbar = tqdm(asset_ids, desc="Ingesting assets", unit="asset")
        for asset_id in pbar:
            pbar.set_postfix_str(f"asset={asset_id[:20]}")
            asset_has_data = False

            # --- Locations ---
            try:
                loc_paths = [
                    f"/assets/{asset_id}/locations",
                    f"/assets/{asset_id}/location-history",
                    f"/locations",
                ]
                raw_locs: list[dict] = []
                for lp in loc_paths:
                    params = dict(date_params)
                    if lp == "/locations":
                        params["asset_id"] = asset_id
                    try:
                        raw_locs = await _paginate(client, lp, params, data_key="locations")
                        if raw_locs:
                            break
                    except Exception:
                        continue

                for rl in raw_locs:
                    loc = extract_location(rl, asset_id)
                    if loc["latitude"] and loc["longitude"] and loc["recorded_at"]:
                        all_locations.append(loc)
                        asset_has_data = True
            except AuthError:
                raise
            except Exception as e:
                errors.append({"asset_id": asset_id, "table": "locations", "error": str(e)})
                log.warning("Error fetching locations for %s: %s", asset_id, e)

            # --- Events ---
            try:
                evt_paths = [
                    f"/assets/{asset_id}/events",
                    f"/assets/{asset_id}/event-history",
                    f"/events",
                ]
                raw_events: list[dict] = []
                for ep in evt_paths:
                    params = dict(date_params)
                    if ep == "/events":
                        params["asset_id"] = asset_id
                    try:
                        raw_events = await _paginate(client, ep, params, data_key="events")
                        if raw_events:
                            break
                    except Exception:
                        continue

                for re_ in raw_events:
                    evt = extract_event(re_, asset_id)
                    if evt["recorded_at"]:
                        all_events.append(evt)
                        asset_has_data = True
            except AuthError:
                raise
            except Exception as e:
                errors.append({"asset_id": asset_id, "table": "events", "error": str(e)})
                log.warning("Error fetching events for %s: %s", asset_id, e)

            # --- Sensors ---
            try:
                sensor_paths = [
                    f"/assets/{asset_id}/sensors",
                    f"/assets/{asset_id}/sensor-readings",
                    f"/sensor-readings",
                    f"/sensors",
                ]
                raw_sensors: list[dict] = []
                for sp in sensor_paths:
                    params = dict(date_params)
                    if sp in ("/sensor-readings", "/sensors"):
                        params["asset_id"] = asset_id
                    try:
                        raw_sensors = await _paginate(client, sp, params, data_key="readings")
                        if raw_sensors:
                            break
                    except Exception:
                        continue

                for rs in raw_sensors:
                    sensor = extract_sensor(rs, asset_id)
                    if sensor["recorded_at"]:
                        all_sensors.append(sensor)
                        asset_has_data = True
            except AuthError:
                raise
            except Exception as e:
                errors.append({"asset_id": asset_id, "table": "sensors", "error": str(e)})
                log.warning("Error fetching sensors for %s: %s", asset_id, e)

            if not asset_has_data:
                stats["zero_record_assets"].append(asset_id)

        # ---- Step 3: Upsert all data into Supabase ----
        log.info("Upserting %d locations...", len(all_locations))
        t_loc = time.time()
        loc_count = upsert_batch(sb, "radar_asset_locations", all_locations, "radar_asset_id,recorded_at")
        stats["locations"] = loc_count
        write_sync_log(sb, "radar_asset_locations", now, loc_count, duration=time.time() - t_loc)

        log.info("Upserting %d events...", len(all_events))
        t_evt = time.time()
        evt_count = upsert_batch(sb, "radar_asset_events", all_events, "radar_asset_id,event_type,recorded_at")
        stats["events"] = evt_count
        write_sync_log(sb, "radar_asset_events", now, evt_count, duration=time.time() - t_evt)

        log.info("Upserting %d sensor readings...", len(all_sensors))
        t_sen = time.time()
        sen_count = upsert_batch(sb, "radar_sensor_readings", all_sensors, "radar_asset_id,sensor_type,recorded_at")
        stats["sensor_readings"] = sen_count
        write_sync_log(sb, "radar_sensor_readings", now, sen_count, duration=time.time() - t_sen)

    stats["errors"] = errors
    elapsed = time.time() - t0

    # ---- Step 4: Validation / report ----
    log.info("Running post-ingest validation...")
    report = validate(sb, stats, elapsed)

    # Print summary
    print("\n" + "=" * 70)
    print("  INGESTION SUMMARY")
    print("=" * 70)
    print(f"  Mode           : {stats['sync_mode']}")
    print(f"  Since           : {stats['since']}")
    print(f"  Assets          : {stats['assets']}")
    print(f"  Locations       : {stats['locations']}")
    print(f"  Events          : {stats['events']}")
    print(f"  Sensor readings : {stats['sensor_readings']}")
    print(f"  Errors          : {len(errors)}")
    if stats["zero_record_assets"]:
        print(f"  Zero-data assets: {len(stats['zero_record_assets'])}")
        for aid in stats["zero_record_assets"][:10]:
            print(f"    - {aid}")
        if len(stats["zero_record_assets"]) > 10:
            print(f"    ... and {len(stats['zero_record_assets']) - 10} more")
    print(f"  Elapsed         : {elapsed:.1f}s")
    print(f"  Report          : {REPORT_DIR / 'radar_ingest_report.json'}")
    print("=" * 70)

    if errors:
        print("\n  ERRORS:")
        for err in errors[:20]:
            print(f"    [{err['table']}] {err['asset_id']}: {err['error']}")
        if len(errors) > 20:
            print(f"    ... and {len(errors) - 20} more")

    return report


# ---------------------------------------------------------------------------
# Phase 4 — Validation
# ---------------------------------------------------------------------------
def validate(sb: Client, stats: dict, elapsed: float) -> dict:
    """Query Supabase, print counts, flag gaps, write report."""
    report: dict = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sync_mode": stats["sync_mode"],
        "since": stats["since"],
        "elapsed_seconds": round(elapsed, 2),
        "table_counts": {},
        "timestamp_ranges": {},
        "zero_record_assets": stats.get("zero_record_assets", []),
        "errors": stats.get("errors", []),
    }

    # Record counts
    for table in ["radar_assets", "radar_asset_locations", "radar_asset_events", "radar_sensor_readings"]:
        try:
            resp = sb.table(table).select("id", count="exact").limit(0).execute()
            report["table_counts"][table] = resp.count or 0
        except Exception as e:
            report["table_counts"][table] = f"error: {e}"

    # Timestamp ranges for locations and events
    for table, col in [("radar_asset_locations", "recorded_at"), ("radar_asset_events", "recorded_at")]:
        try:
            earliest = (
                sb.table(table)
                .select(col)
                .order(col, desc=False)
                .limit(1)
                .execute()
            )
            latest = (
                sb.table(table)
                .select(col)
                .order(col, desc=True)
                .limit(1)
                .execute()
            )
            report["timestamp_ranges"][table] = {
                "earliest": earliest.data[0][col] if earliest.data else None,
                "latest": latest.data[0][col] if latest.data else None,
            }
        except Exception as e:
            report["timestamp_ranges"][table] = {"error": str(e)}

    # Print validation
    print("\n  VALIDATION:")
    for table, count in report["table_counts"].items():
        print(f"    {table:35s} : {count}")
    for table, rng in report["timestamp_ranges"].items():
        if isinstance(rng, dict) and "earliest" in rng:
            print(f"    {table} range: {rng['earliest']} → {rng['latest']}")

    if report["zero_record_assets"]:
        print(f"\n  WARNING: {len(report['zero_record_assets'])} asset(s) returned zero records (possible API gaps)")

    # Write report
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / "radar_ingest_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)

    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="BlackBerry Radar → Supabase ingestion")
    parser.add_argument("--full", action="store_true", help="Force full historical sync (ignore last_synced_at)")
    args = parser.parse_args()

    asyncio.run(ingest(force_full=args.full))


if __name__ == "__main__":
    main()
