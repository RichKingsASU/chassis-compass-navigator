"""
BlackBerry Radar GPS Data Ingestion
====================================
Uses bb_authoritative_list as the source of truth for which chassis are
repair chassis. Phase 1 skips chassis that already have complete distance
history. Phase 2 drains the stream with cursor persistence for crash resume.

Robustness features:
  - TCP keepalives on DB connection (survives long-running sessions)
  - Per-account transaction rollback on failure
  - Resilient log_sync_failed (opens fresh connection if current is dead)
  - Phase 2 cursor written every 50 batches, deleted on clean completion

Run from PowerShell:
    python blackberry_radar_ingest.py
"""

import jwt, time, json, requests, psycopg2, psycopg2.extras, os, sys, uuid
from datetime import datetime, timezone, timedelta

# ── CONFIG ─────────────────────────────────────────────────────────────────────

DB_URL   = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
BASE_URL = "https://api.radar.blackberry.com/1"
OAUTH_URL = "https://oauth2.radar.blackberry.com/1/token"

ACCOUNTS = {
    "tran": {
        "app_id":      "35dc0199-1903-4a31-a310-8a364d6c1c41",
        "private_key": """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgDKXvav2i7E0lqxR6
ij9ejAcEszV1vWOnOxKzj6opAIShRANCAAQ241ZuALZvoFhmGv5scfi16IpSTD1S
Gf5AsE7wlhHpR5SyRziuM55Gj19dSHailX4O2oDYvW9eiW8P90Mu+KFD
-----END PRIVATE KEY-----""",
        "table":       "blackberry_tran_gps",
        "token_file":  "tran_stream_token.json",
        "cursor_file": "tran_phase2_cursor.json",
    },
    "log": {
        "app_id":      "e723dbdd-9cb5-46ae-953c-880feba2e50e",
        "private_key": """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgmmEmx6/PTr/38R31
WdyGdCKPYT49VrOG3D2b8VGKwtmhRANCAAQQlQs2yAMlwyevZGT6hM6AM+phQD42
7sGf1lyq9yBNLE+ZnCJ1sCWp2vxciPTZ8tzH4KxS5KEDA+BgO10GyOxO
-----END PRIVATE KEY-----""",
        "table":       "blackberry_log_gps",
        "token_file":  "log_stream_token.json",
        "cursor_file": "log_phase2_cursor.json",
    },
}

# Skip chassis that already have 12 chunks in {table}_distance.
# Set False to force re-pull of every chassis (wastes API quota).
GAP_FILL_PHASE1 = True

# Skip Phase 2 entirely. Useful for seeding + verifying before running the
# long stream drain. Set False to run Phase 2 after Phase 1.
SKIP_PHASE2 = False

# History window — API allows max 61-day chunks.
# API enforces a rolling 2-year retention window. Compute floor dynamically
# with a 2-day buffer so we don't race the clock during long runs.
HISTORY_START_MS  = int((datetime.now(tz=timezone.utc) - timedelta(days=730)).timestamp() * 1000) + (2 * 24 * 60 * 60 * 1000)
HISTORY_END_MS    = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
CHUNK_MS          = 61 * 24 * 60 * 60 * 1000


# ── DB CONNECTION ──────────────────────────────────────────────────────────────

def open_db():
    """Open a psycopg2 connection with TCP keepalives configured so long
    runs survive Windows idle-socket resets."""
    return psycopg2.connect(
        DB_URL,
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )


# ── AUTHORITATIVE CHASSIS LIST ─────────────────────────────────────────────────

def load_repair_chassis(conn, account_name: str) -> set:
    """Load authoritative repair chassis list for a specific account
    from the bb_authoritative_list table.

    Raises RuntimeError if the table is empty for this account to prevent
    silently treating every asset as non-repair.
    """
    with conn.cursor() as cur:
        cur.execute("""
            SELECT identifier
            FROM bb_authoritative_list
            WHERE account = %s
        """, (account_name,))
        ids = {r[0] for r in cur.fetchall()}

    if not ids:
        raise RuntimeError(
            f"bb_authoritative_list has no rows for account='{account_name}'. "
            "Refresh the table before running ingest."
        )
    print(f"  Loaded {len(ids)} repair chassis from bb_authoritative_list for '{account_name}'")
    return ids


# ── OAUTH AUTH FLOW ────────────────────────────────────────────────────────────

class RadarAuth:
    """Handles JWT creation, OAuth token exchange, and auto-refresh."""

    def __init__(self, app_id: str, private_key: str):
        self.app_id      = app_id
        self.private_key = private_key
        self._access_token = None
        self._token_expiry = 0

    def _make_client_jwt(self) -> str:
        now = int(time.time())
        payload = {
            "jti": str(uuid.uuid4()),
            "iss": self.app_id,
            "sub": self.app_id,
            "aud": "https://oauth2.radar.blackberry.com",
            "iat": now,
            "exp": now + 60,
        }
        return jwt.encode(payload, self.private_key, algorithm="ES256")

    def get_access_token(self) -> str:
        if self._access_token and time.time() < self._token_expiry - 30:
            return self._access_token

        client_jwt = self._make_client_jwt()

        resp = requests.post(
            OAUTH_URL,
            json={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion":  client_jwt,
                "scope":      "assets:read assets:stream",
            },
            headers={"Content-Type": "application/json"},
            timeout=15,
        )

        if resp.status_code != 200:
            raise RuntimeError(
                f"OAuth token exchange failed: {resp.status_code} {resp.text[:300]}"
            )

        data = resp.json()
        self._access_token = data["access_token"]
        expires_in = data.get("expires_in", 300)
        self._token_expiry = time.time() + expires_in
        print(f"  ✅ Access token obtained (expires in {expires_in}s)")
        return self._access_token

    def headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Accept":        "application/json",
            "Content-Type":  "application/json",
        }


# ── TABLE DDL ──────────────────────────────────────────────────────────────────

def setup_tables(conn, table):
    tbl = table.replace("blackberry_","").replace("_gps","")
    stmts = [
        f"""CREATE TABLE IF NOT EXISTS {table}_assets (
            id                 bigserial PRIMARY KEY,
            asset_uuid         text UNIQUE,
            identifier         text,
            asset_type         text,
            asset_class        text,
            sensors            jsonb,
            initial_distance_m bigint,
            is_repair_chassis  boolean,
            raw                jsonb,
            loaded_at          timestamptz DEFAULT now()
        )""",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_assets_id ON {table}_assets(identifier)",
        f"""CREATE TABLE IF NOT EXISTS {table}_distance (
            id                 bigserial PRIMARY KEY,
            asset_uuid         text,
            identifier         text,
            initial_distance_m bigint,
            total_distance_m   bigint,
            drive_distance_m   bigint,
            changed_on         timestamptz,
            record_start       timestamptz,
            record_end         timestamptz,
            window_start_ms    bigint,
            window_end_ms      bigint,
            is_repair_chassis  boolean,
            loaded_at          timestamptz DEFAULT now()
        )""",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_dist_id ON {table}_distance(identifier)",
        f"""CREATE TABLE IF NOT EXISTS {table} (
            id                bigserial PRIMARY KEY,
            device_id         text,
            event_type        text,
            recorded_on       timestamptz,
            recorded_on_ms    bigint,
            chassis_number    text,
            lat               numeric,
            lon               numeric,
            geofence_id       text,
            geofence_name     text,
            velocity          numeric,
            battery_state     boolean,
            container_mounted boolean,
            event_subtype     text,
            fence_id          text,
            is_repair_chassis boolean,
            raw_values        jsonb,
            loaded_at         timestamptz DEFAULT now(),
            UNIQUE(device_id, recorded_on_ms, event_type)
        )""",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_chassis  ON {table}(chassis_number)",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_ts       ON {table}(recorded_on)",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_repair   ON {table}(is_repair_chassis, recorded_on) WHERE is_repair_chassis = true",
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_geofence ON {table}(geofence_name, recorded_on)",
    ]
    with conn.cursor() as cur:
        for s in stmts:
            cur.execute(s)
    conn.commit()
    print(f"  Tables ready: {table}_assets | {table}_distance | {table}")


# ── SYNC LOG ──────────────────────────────────────────────────────────────────

def log_sync_start(conn, provider: str) -> int:
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO gps_sync_log (provider, status, started_at)
            VALUES (%s, 'running', now())
            RETURNING id
        """, (provider,))
        row = cur.fetchone()
    conn.commit()
    return row[0] if row else -1


def log_sync_complete(conn, sync_id: int, provider: str,
                      assets_found: int, repair_found: int,
                      rows_inserted: int, chunks_total: int, chunks_loaded: int):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE gps_sync_log SET
                status        = 'success',
                assets_found  = %s,
                repair_found  = %s,
                rows_inserted = %s,
                chunks_total  = %s,
                chunks_loaded = %s,
                completed_at  = now()
            WHERE id = %s
        """, (assets_found, repair_found, rows_inserted,
              chunks_total, chunks_loaded, sync_id))
    conn.commit()
    print(f"  ✅ Sync log updated for {provider} (id={sync_id})")


def log_sync_failed(conn, sync_id: int, error_message: str):
    """Best-effort failure logging. If the current connection is dead,
    opens a fresh one. Never raises — a failed sync_log update should not
    mask the original error."""
    def _write(c):
        with c.cursor() as cur:
            cur.execute("""
                UPDATE gps_sync_log SET
                    status        = 'failed',
                    completed_at  = now(),
                    error_message = %s
                WHERE id = %s
            """, (error_message[:500], sync_id))
        c.commit()

    try:
        _write(conn)
        return
    except Exception as e:
        print(f"  [log_sync_failed] primary conn dead ({e}); retrying with fresh connection...", file=sys.stderr)

    try:
        fresh = open_db()
        try:
            _write(fresh)
        finally:
            fresh.close()
    except Exception as e:
        print(f"  [log_sync_failed] fresh connection also failed: {e}", file=sys.stderr)
        print(f"  [log_sync_failed] original error was: {error_message[:200]}", file=sys.stderr)


# ── HTTP HELPER ────────────────────────────────────────────────────────────────

def api_get(auth: RadarAuth, path: str, params: dict = None):
    for attempt in range(3):
        try:
            r = requests.get(
                f"{BASE_URL}{path}",
                headers=auth.headers(),
                params=params,
                timeout=30,
            )
        except requests.RequestException as e:
            print(f"    Network error: {e}"); time.sleep(5); continue

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", r.headers.get("X-RateLimit-Reset", 5)))
            print(f"    Rate limited — waiting {wait}s..."); time.sleep(wait); continue
        if r.status_code == 401:
            print(f"    401: {r.text[:200]}")
            auth._token_expiry = 0
            continue
        if r.status_code == 404:
            return None
        if r.status_code != 200:
            print(f"    HTTP {r.status_code}: {r.text[:200]}"); return None

        time.sleep(int(r.headers.get("X-RateLimit-Reset", 1)))
        return r.json()
    return None


# ── PHASE 1: ASSETS + DISTANCE ─────────────────────────────────────────────────

def phase1(account_name, config, conn, auth, repair_set):
    print(f"\n── Phase 1: Assets + Distance History [{account_name.upper()}] ──")
    table = config["table"]

    data = api_get(auth, "/assets", {"size": 10000, "from": 0})
    if data is None:
        print("  Could not fetch assets."); return {}

    assets = data if isinstance(data, list) else data.get("items", [])
    print(f"  Total assets in account: {len(assets)}")

    uuid_map     = {}
    repair_found = []

    for a in assets:
        identifier = (a.get("identifier") or "").strip().replace(" ", "")
        asset_uuid = a.get("asset_id") or a.get("id")
        if not asset_uuid:
            continue
        is_repair = identifier in repair_set
        if is_repair:
            repair_found.append(identifier)
        uuid_map[identifier] = asset_uuid

        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {table}_assets
                    (asset_uuid, identifier, asset_type, asset_class, sensors,
                     initial_distance_m, is_repair_chassis, raw)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (asset_uuid) DO UPDATE SET
                    identifier=EXCLUDED.identifier, loaded_at=now()
            """, (asset_uuid, identifier, a.get("type"), a.get("asset_class"),
                  json.dumps(a.get("sensors",[])), a.get("initial_distance"),
                  is_repair, json.dumps(a)))
        conn.commit()

    print(f"  Repair chassis found in this account: {len(repair_found)}")
    missing_from_api = repair_set - set(repair_found)
    if missing_from_api:
        print(f"  ⚠️  {len(missing_from_api)} chassis in authoritative list but NOT returned by API:")
        print(f"     {sorted(missing_from_api)}")
    config['_repair_found_count'] = len(repair_found)
    config['_assets_found_count'] = len(assets)

    # Build 61-day chunks
    chunks = []
    s = HISTORY_START_MS
    while s < HISTORY_END_MS:
        e = min(s + CHUNK_MS, HISTORY_END_MS)
        chunks.append((s, e))
        s = e
    print(f"\n  Pulling distance history in {len(chunks)} x 61-day chunks...")

    def ms_to_dt(ms):
        return datetime.fromtimestamp(ms/1000, tz=timezone.utc) if ms else None

    # ──── Gap detection: skip chassis with complete distance history ────
    if GAP_FILL_PHASE1:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT identifier, COUNT(*) AS chunk_count
                FROM {table}_distance
                WHERE is_repair_chassis = true
                GROUP BY identifier
            """)
            already_loaded = {r[0]: r[1] for r in cur.fetchall()}

        expected = len(chunks)
        missing  = [c for c in repair_found if already_loaded.get(c, 0) < expected]
        complete = [c for c in repair_found if already_loaded.get(c, 0) >= expected]

        print(f"  Already complete: {len(complete)} chassis (skipping)")
        print(f"  Missing or partial: {len(missing)} chassis (will seed)")
        if missing:
            print(f"  Will seed: {sorted(missing, reverse=True)}")

        if not missing:
            print("  Nothing to do — all repair chassis have full distance history.")
            return uuid_map

        chassis_to_pull = sorted(missing, reverse=True)
    else:
        chassis_to_pull = sorted(repair_found, reverse=True)

    for identifier in chassis_to_pull:
        asset_uuid = uuid_map[identifier]
        total_drive_m = 0
        chunks_loaded = 0

        for chunk_start, chunk_end in chunks:
            dist = api_get(auth, f"/assets/{asset_uuid}/distance", {
                "gte": chunk_start, "lte": chunk_end,
            })
            if not dist:
                continue

            drive_m = dist.get("drive_distance") or 0
            total_drive_m += drive_m
            chunks_loaded += 1

            with conn.cursor() as cur:
                cur.execute(f"""
                    INSERT INTO {table}_distance
                        (asset_uuid, identifier, initial_distance_m, total_distance_m,
                         drive_distance_m, changed_on, record_start, record_end,
                         window_start_ms, window_end_ms, is_repair_chassis)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (asset_uuid, identifier,
                      dist.get("initial_distance"), dist.get("total_distance"),
                      drive_m,
                      ms_to_dt(dist.get("changed_on")),
                      ms_to_dt(dist.get("record_start")),
                      ms_to_dt(dist.get("record_end")),
                      chunk_start, chunk_end, True))
            conn.commit()

        total_drive_mi = round(total_drive_m / 1609.34, 1)
        print(f"  {identifier}: {total_drive_mi} mi total | {chunks_loaded}/{len(chunks)} chunks")

    return uuid_map


# ── PHASE 2: STREAM DRAIN ──────────────────────────────────────────────────────

def parse_item(item, repair_set):
    v       = item.get("values", {})
    chassis = ((v.get("asset",{}).get("params",{}).get("identifier")
                or v.get("identifier") or "").strip().replace(" ","")) or None
    geo     = v.get("geo_location", {})
    fences  = v.get("geofences", [])
    ms      = item.get("recorded_on", 0)
    return {
        "device_id":         item.get("device_id"),
        "event_type":        item.get("id"),
        "recorded_on":       datetime.fromtimestamp(ms/1000, tz=timezone.utc) if ms else None,
        "recorded_on_ms":    ms,
        "chassis_number":    chassis,
        "lat":               geo.get("lat"),
        "lon":               geo.get("lon"),
        "geofence_id":       fences[0].get("id")   if fences else None,
        "geofence_name":     fences[0].get("name") if fences else None,
        "velocity":          v.get("velocity"),
        "battery_state":     v.get("battery_state"),
        "container_mounted": v.get("container_mounting_state"),
        "event_subtype":     v.get("type"),
        "fence_id":          v.get("fenceid"),
        "is_repair_chassis": chassis in repair_set if chassis else False,
        "raw_values":        json.dumps(v),
    }


def phase2(account_name, config, conn, auth, repair_set):
    print(f"\n── Phase 2: Stream Drain [{account_name.upper()}] ──")
    table       = config["table"]
    token_file  = config["token_file"]
    cursor_file = config["cursor_file"]

    total_inserted = 0
    total_items    = 0
    batch_num      = 0
    repair_seen    = set()

    # Resume hint if a previous run crashed mid-drain
    if os.path.exists(cursor_file):
        try:
            with open(cursor_file, 'r') as f:
                prev = json.load(f)
            print(f"  Resuming: found cursor file from previous run "
                  f"(saved_at={prev.get('saved_at')}, batches={prev.get('batch_num')})")
        except Exception as e:
            print(f"  Cursor file present but unreadable: {e}")

    while True:
        batch_num += 1
        try:
            r = requests.get(
                f"{BASE_URL}/assets/data",
                headers=auth.headers(),
                timeout=30,
            )
        except requests.RequestException as e:
            print(f"  Network error: {e}"); break

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", r.headers.get("X-RateLimit-Reset", 5)))
            print(f"  Rate limited — {wait}s..."); time.sleep(wait); continue
        if r.status_code == 401:
            print(f"  401: {r.text[:200]}")
            auth._token_expiry = 0; continue
        if r.status_code != 200:
            print(f"  HTTP {r.status_code}: {r.text[:200]}"); break

        data    = r.json()
        items   = data.get("items", [])
        token   = data.get("token")

        if not items:
            print(f"  Stream empty — backlog fully consumed."); break

        parsed = [parse_item(i, repair_set) for i in items]
        cols   = ["device_id","event_type","recorded_on","recorded_on_ms",
                  "chassis_number","lat","lon","geofence_id","geofence_name",
                  "velocity","battery_state","container_mounted","event_subtype",
                  "fence_id","is_repair_chassis","raw_values"]
        rows = [tuple(p[c] for c in cols) for p in parsed]

        with conn.cursor() as cur:
            psycopg2.extras.execute_values(cur, f"""
                INSERT INTO {table} ({",".join(cols)}) VALUES %s
                ON CONFLICT (device_id, recorded_on_ms, event_type) DO NOTHING
            """, rows)
        conn.commit()

        total_inserted += len(rows)
        total_items    += len(items)
        for p in parsed:
            if p["is_repair_chassis"] and p["chassis_number"]:
                repair_seen.add(p["chassis_number"])

        # Legacy per-batch token save (always written)
        if token and token[0] is not None:
            with open(token_file, "w") as f:
                json.dump({"token": token, "saved_at": datetime.now().isoformat()}, f, indent=2)

        # Crash-resume cursor snapshot every 50 batches
        if batch_num % 50 == 0:
            with open(cursor_file, "w") as f:
                json.dump({
                    "account":         account_name,
                    "batch_num":       batch_num,
                    "total_inserted":  total_inserted,
                    "total_items":     total_items,
                    "token":           token,
                    "saved_at":        datetime.now().isoformat(),
                }, f, indent=2)

        if batch_num % 10 == 0 or len(items) < 20:
            print(f"  Batch {batch_num:04d} | {len(items):4d} items | "
                  f"{total_inserted:6d} inserted | repair seen: {len(repair_seen)}")

        time.sleep(int(r.headers.get("X-RateLimit-Reset", 5)))

    # Clean completion: remove cursor file
    if os.path.exists(cursor_file):
        try:
            os.remove(cursor_file)
        except Exception as e:
            print(f"  Could not delete cursor file: {e}")

    print(f"\n  Done [{account_name.upper()}]: {batch_num} batches | "
          f"{total_items} items | {total_inserted} inserted")
    print(f"  Repair chassis in stream: {len(repair_seen)}")
    if repair_seen: print(f"  {sorted(repair_seen)}")
    print(f"  ⚠️  Stream NOT acknowledged. Run acknowledge_tokens.py when confirmed.")
    config['_rows_inserted'] = total_inserted


# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    print("BlackBerry Radar GPS Ingestion")
    print(f"  GAP_FILL_PHASE1: {GAP_FILL_PHASE1}")
    print(f"  SKIP_PHASE2:     {SKIP_PHASE2}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    for name, cfg in ACCOUNTS.items():
        if "PASTE" in cfg["private_key"]:
            print(f"\n⛔  {name.upper()} private key not set."); return

    try:
        conn = open_db()
        print("Database connected (with keepalives).")
    except Exception as e:
        print(f"DB connection failed: {e}"); return

    for name, config in ACCOUNTS.items():
        print(f"\n{'='*60}\nACCOUNT: {name.upper()}\n{'='*60}")
        sync_id = -1
        try:
            auth = RadarAuth(config["app_id"], config["private_key"])
            setup_tables(conn, config["table"])
            repair_set = load_repair_chassis(conn, name)
            sync_id = log_sync_start(conn, name)

            phase1(name, config, conn, auth, repair_set)

            if SKIP_PHASE2:
                print(f"\n── Phase 2 SKIPPED (SKIP_PHASE2 = True) ──")
            else:
                phase2(name, config, conn, auth, repair_set)

            log_sync_complete(
                conn, sync_id, name,
                assets_found  = config.get('_assets_found_count', 0),
                repair_found  = config.get('_repair_found_count', 0),
                rows_inserted = config.get('_rows_inserted', 0),
                chunks_total  = 12,
                chunks_loaded = config.get('_repair_found_count', 0) * 12,
            )
        except KeyboardInterrupt:
            print(f"\nInterrupted during {name} — progress saved.")
            if sync_id > 0: log_sync_failed(conn, sync_id, "Interrupted by user")
            try: conn.rollback()
            except Exception: pass
            break
        except Exception as e:
            import traceback
            print(f"Error in {name}: {e}")
            traceback.print_exc()
            if sync_id > 0: log_sync_failed(conn, sync_id, str(e))
            # Roll back this account's failed transaction so the next
            # account starts with a clean connection state.
            try:
                conn.rollback()
                print(f"  Rolled back {name} transaction; continuing to next account.")
            except Exception as rb_err:
                print(f"  Rollback failed ({rb_err}); reopening connection.")
                try: conn.close()
                except Exception: pass
                try:
                    conn = open_db()
                    print("  Reopened connection.")
                except Exception as open_err:
                    print(f"  Could not reopen connection: {open_err}")
                    break

    try: conn.close()
    except Exception: pass
    print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()