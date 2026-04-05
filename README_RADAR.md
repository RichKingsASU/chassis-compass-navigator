# BlackBerry Radar → Supabase Data Pipeline

Incremental sync pipeline that pulls asset location history, events, and sensor
readings from the BlackBerry Radar API into Supabase.

## Prerequisites

- Python 3.11+
- A BlackBerry Radar account with API access
- A Supabase project with the migration applied

Install Python dependencies:

```bash
pip install httpx supabase python-dotenv tenacity tqdm
```

## Setup

1. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

2. **Fill in credentials** in `.env`:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — service-role key (not anon)
   - `RADAR_API_BASE_URL` — Radar API base (e.g. `https://api.blackberry.com/radar/v1`)
   - `RADAR_API_KEY` — your Bearer token or API key

3. **Run the database migration**

   Apply the schema to create the `radar_*` tables:

   ```bash
   # Via Supabase CLI
   supabase db push

   # Or run the SQL directly in the Supabase SQL Editor:
   # supabase/migrations/20240101000009_blackberry_radar_schema.sql
   ```

## Usage

### Phase 1 — API Discovery

Run the discovery tool first to verify connectivity and learn about available
endpoints, pagination style, rate limits, and historical data windows:

```bash
python scripts/radar_discover.py
```

This prints a full report to the console and saves it to
`reports/radar_discovery_report.json`.

### Phase 3 — Data Ingestion

**First run** (full historical pull):

```bash
python scripts/radar_ingest.py
```

On the first run there is no `last_synced_at` in `radar_sync_log`, so the
script pulls all data going back `RADAR_MAX_HISTORY_DAYS` days (default 365).

**Subsequent runs** (incremental):

```bash
python scripts/radar_ingest.py
```

The script reads `radar_sync_log` and only fetches records newer than
`last_synced_at`. Run this on a cron schedule (e.g. every 15 minutes) for
near-real-time sync.

**Force a full re-sync**:

```bash
python scripts/radar_ingest.py --full
```

### Phase 4 — Validation

Validation runs automatically at the end of each ingestion. It:

1. Queries Supabase for record counts per table
2. Shows earliest/latest timestamps in `radar_asset_locations` and `radar_asset_events`
3. Flags assets that returned zero records (possible API gaps)
4. Writes results to `reports/radar_ingest_report.json`

## Reading the Discovery Report

`reports/radar_discovery_report.json` contains:

| Field              | Description                                         |
| ------------------ | --------------------------------------------------- |
| `endpoints`        | Each probed path with status, auth style, pagination |
| `history_windows`  | How many records each date range returned            |
| `summary.auth_style` | `bearer` or `api_key`                             |
| `summary.pagination_style` | `cursor`, `offset`, `page`, or `link_header` |
| `summary.max_history_days` | Furthest window that returned data            |

## Database Tables

| Table                     | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `radar_assets`            | Master list of tracked assets              |
| `radar_asset_locations`   | Historical GPS pings (lat/lng/speed/etc.)  |
| `radar_asset_events`      | Door open/close, movement, geofence events |
| `radar_sensor_readings`   | Temperature, humidity, cargo, battery data |
| `radar_sync_log`          | Tracks last sync time per table            |

All tables use `UNIQUE` constraints so upserts are idempotent — you can safely
re-run the pipeline without creating duplicates.

## Tuning

Set these optional env vars in `.env`:

| Variable                | Default | Description                          |
| ----------------------- | ------- | ------------------------------------ |
| `RADAR_PAGE_SIZE`       | 100     | Records per API page                 |
| `RADAR_MAX_HISTORY_DAYS`| 365     | Days of history on first full sync   |
| `RADAR_BATCH_SIZE`      | 500     | Rows per Supabase upsert batch       |

## Error Handling

- **429 / 503**: Retried automatically with exponential back-off (up to 6 attempts)
- **401 / 403**: Script stops and prints credential-check instructions
- **404**: Endpoint skipped gracefully, logged as warning
- **Network errors**: Logged and the script continues with the next asset

All errors are collected and printed in the summary, and written to the
ingest report JSON.
