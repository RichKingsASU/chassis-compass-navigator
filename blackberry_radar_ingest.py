"""
# =============================================================================
# blackberry_radar_ingest.py
# =============================================================================
# Project      : Chassis Compass Navigator (CCN)
# Company      : Forrest Transportation LLC  (SCAC: FRQT)
# Author       : Richard King
# Created      : 2026-04-20
# Last Modified: 2026-04-29
# Version      : 2.1.0
#
# Version History:
#   1.0.0  2026-04-20  Initial release — full history pull (12 x 61-day chunks)
#   2.0.0  2026-04-28  Switched to 59-day rolling window (single chunk per chassis)
#                      Added .env.local credential loading
#                      Added bb_distance_seed_progress table for full resumability
#                      Added live progress bar (no external deps)
#                      Fixed chunks_total/chunks_loaded in gps_sync_log
#                      Added PEM key validation diagnostic on startup
#   2.1.0  2026-04-29  Improved load_env: handles BOM, CRLF, quoted values
#                      Token fetch retries up to 5x with backoff
#                      DB keepalives enabled
# =============================================================================
#
# Description:
#   Ingests BlackBerry Radar GPS telemetry for two accounts (TRAN, LOG) into
#   local Supabase.  Runs in two phases per account:
#
#   Phase 1 — Assets + Distance History (RESUMABLE)
#     Fetches all assets, upserts to *_assets table, then pulls 59-day distance
#     history for every repair chassis.  Progress is checkpointed per-chassis
#     per-chunk in bb_distance_seed_progress so interrupted runs resume exactly
#     where they left off.
#
#   Phase 2 — Stream Drain
#     Drains the BlackBerry event stream in 1000-item batches, inserting into
#     the *_gps table.  Stream token is saved to JSON after each batch but NOT
#     acknowledged until acknowledge_tokens.py is run manually.
#
# Credentials:
#   Loaded from .env.local in the same directory.  Required keys:
#     BB_TRAN_ID   — BlackBerry app_id for TRAN account
#     BB_TRAN_KEY  — EC private key (PEM, \n-encoded on one line)
#     BB_LOG_ID    — BlackBerry app_id for LOG account
#     BB_LOG_KEY   — EC private key (PEM, \n-encoded on one line)
#
# Run from PowerShell:
#   $env:PYTHONIOENCODING = "utf-8"
#   python -u blackberry_radar_ingest.py 2>&1 | Tee-Object -FilePath ".\logs\blackberry_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
# =============================================================================
"""

import jwt, time, json, requests, psycopg2, psycopg2.extras, os, uuid, sys
from datetime import datetime, timezone
from pathlib import Path

# ── LOAD .env ──────────────────────────────────────────────────────────────────

def load_env(env_path: str = None):
    """Load key=value pairs from .env.local into os.environ.

    Handles BOM, CRLF, quoted values, and literal \\n in PEM keys.
    """
    path = Path(env_path or Path(__file__).parent / ".env.local")
    if not path.exists():
        print(f"⛔  .env.local file not found at {path}")
        sys.exit(1)

    raw = path.read_text(encoding="utf-8-sig")

    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()

        # Strip one layer of surrounding quotes
        if len(val) >= 2 and (
            (val.startswith('"') and val.endswith('"')) or
            (val.startswith("'") and val.endswith("'"))
        ):
            val = val[1:-1]

        # Convert literal \n to real newlines (required for PEM keys)
        val = val.replace("\\n", "\n")

        os.environ.setdefault(key, val)


def _check_pem(label: str, key: str):
    """Print a quick diagnostic so PEM problems are immediately visible."""
    lines = key.strip().splitlines()
    first = lines[0].strip() if lines else "(empty)"
    last  = lines[-1].strip() if lines else "(empty)"
    ok    = first.startswith("-----BEGIN") and last.startswith("-----END")
    status = "OK" if ok else "MALFORMED"
    print(f"  PEM {label}: {status} | {len(lines)} lines | first=\'{first}\' | last=\'{last}\'")
    if not ok:
        print(f"  ⛔  {label} key does not look like a valid PEM — check .env.local")
        sys.exit(1)


load_env()

def require_env(key: str) -> str:
    val = os.environ.get(key, "").strip()
    if not val:
        print(f"⛔  Missing required .env key: {key}")
        sys.exit(1)
    return val

# ── CONFIG ─────────────────────────────────────────────────────────────────────

DB_URL    = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
BASE_URL  = "https://api.radar.blackberry.com/1"
OAUTH_URL = "https://oauth2.radar.blackberry.com/1/token"

ACCOUNTS = {
    "tran": {
        "app_id":      require_env("BB_TRAN_ID"),
        "private_key": require_env("BB_TRAN_KEY"),
        "table":       "blackberry_tran_gps",
        "token_file":  "tran_stream_token.json",
    },
    "log": {
        "app_id":      require_env("BB_LOG_ID"),
        "private_key": require_env("BB_LOG_KEY"),
        "table":       "blackberry_log_gps",
        "token_file":  "log_stream_token.json",
    },
}

# History window — pull only the last 59 days (fits in a single API chunk)
HISTORY_START_MS = int((datetime.now(tz=timezone.utc).timestamp() - 59 * 24 * 60 * 60) * 1000)
HISTORY_END_MS   = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
CHUNK_MS         = 59 * 24 * 60 * 60 * 1000   # 59 days → single chunk per chassis

REPAIR_CHASSIS = {
    # --- Original ---
    'MCCZ407970','MCCZ410430','MCCZ410480','MCCZ410481','MCCZ410522','MCCZ411285',
    'FRQZ400136','FRQZ400111','MCCZ451333','MCCZ411331','FRQZ400153','FRQZ400128',
    'FRQZ400051','MCCZ422795','FRQZ400022','MCCZ422814','MCCZ421701','FRQZ400038',
    'FRQZ400163','FRQZ400107','MCCZ410485','MCCZ410494','FRQZ400162','MCCZ410508',
    'FRQZ400014','FRQZ400017','FRQZ400039','FRQZ400083','FRQZ400085','FRQZ400086',
    'FRQZ400114','FRQZ400120','FRQZ400137','FRQZ400143','FRQZ400166','MCCZ404585',
    'MCCZ410515','MCCZ410520','MCCZ410523','MCCZ410526','MCCZ410529','MCCZ411502',
    'MCCZ421703','MCHZ401451','MCHZ401803','MCHZ401862','FRQZ400052','MCCZ411312',
    'FRQZ400042','FRQZ400113','FRQZ400064','FRQZ400002','FRQZ400101','MCCZ407977',
    'FRQZ400003','FRQZ400063','MCCZ410500','MCCZ421675','MCCZ422806','FRQZ400082',
    'FRQZ400048','MCCZ422802','MCHZ401800','FRQZ400045',

    # --- FRQZ additions ---
    'FRQZ400070','FRQZ400071','FRQZ400072','FRQZ400073','FRQZ400074','FRQZ400075',
    'FRQZ400076','FRQZ400077','FRQZ400078','FRQZ400079','FRQZ400080','FRQZ400081',
    'FRQZ400084','FRQZ400087','FRQZ400088','FRQZ400089','FRQZ400090','FRQZ400091',
    'FRQZ400092','FRQZ400093','FRQZ400094','FRQZ400095','FRQZ400096','FRQZ400097',
    'FRQZ400098','FRQZ400099','FRQZ400100','FRQZ400102','FRQZ400103','FRQZ400104',
    'FRQZ400105','FRQZ400106','FRQZ400108','FRQZ400109','FRQZ400110','FRQZ400112',
    'FRQZ400115','FRQZ400116','FRQZ400117','FRQZ400118','FRQZ400119',

    # --- MCCZ 300 series ---
    'MCCZ301004','MCCZ301034','MCCZ301035','MCCZ301038','MCCZ301051','MCCZ301055',
    'MCCZ301067','MCCZ301075','MCCZ301080','MCCZ301095','MCCZ301162','MCCZ301406',
    'MCCZ301507','MCCZ301513','MCCZ301629','MCCZ301641','MCCZ301724','MCCZ301733',
    'MCCZ301736','MCCZ301747','MCCZ301749','MCCZ301820','MCCZ301829',

    # --- MCCZ 340 series ---
    'MCCZ342358','MCCZ342359','MCCZ342362','MCCZ342460','MCCZ342468','MCCZ342469',
    'MCCZ342470','MCCZ342471','MCCZ342608','MCCZ342609','MCCZ342610','MCCZ342611',
    'MCCZ342612',

    # --- MCCZ 400 series ---
    'MCCZ404048','MCCZ404164','MCCZ404240','MCCZ404251','MCCZ404315','MCCZ404580',
    'MCCZ404735','MCCZ404789','MCCZ405416','MCCZ406352','MCCZ407256','MCCZ407588',
    'MCCZ407824','MCCZ407955','MCCZ409415','MCCZ409488',

    # --- MCCZ 410 series ---
    'MCCZ410401','MCCZ410407','MCCZ410482','MCCZ410484','MCCZ410489','MCCZ410490',
    'MCCZ410491','MCCZ410492','MCCZ410502','MCCZ410503','MCCZ410507','MCCZ410509',
    'MCCZ410511','MCCZ410516','MCCZ410517','MCCZ410521','MCCZ410525','MCCZ410528',
    'MCCZ410530','MCCZ410531','MCCZ410532','MCCZ410534','MCCZ410535','MCCZ410546',
    'MCCZ410577','MCCZ410590','MCCZ410827',

    # --- MCCZ 411 series ---
    'MCCZ411072','MCCZ411073','MCCZ411238','MCCZ411242','MCCZ411244','MCCZ411254',
    'MCCZ411262','MCCZ411269','MCCZ411271','MCCZ411273','MCCZ411304','MCCZ411305',
    'MCCZ411306','MCCZ411307','MCCZ411308','MCCZ411310','MCCZ411311','MCCZ411320',
    'MCCZ411324','MCCZ411325','MCCZ411332','MCCZ411333','MCCZ411334','MCCZ411335',
    'MCCZ411336','MCCZ411337','MCCZ411341','MCCZ411342','MCCZ411343','MCCZ411345',
    'MCCZ411346','MCCZ411367','MCCZ411369','MCCZ411389','MCCZ411405','MCCZ411417',
    'MCCZ411428','MCCZ411430','MCCZ411431','MCCZ411455','MCCZ411456','MCCZ411479',
    'MCCZ411484','MCCZ411493','MCCZ411495','MCCZ411496','MCCZ411497','MCCZ411498',
    'MCCZ411499','MCCZ411501','MCCZ411536','MCCZ411537','MCCZ411538','MCCZ411539',
    'MCCZ411540',

    # --- Remaining MCCZ / MCHZ ---
    'MCCZ413275','MCCZ413277','MCCZ413285','MCCZ413365','MCCZ413466','MCCZ413805',
    'MCCZ415182','MCCZ415246','MCCZ415262','MCCZ415789','MCCZ415849','MCCZ415851',
    'MCCZ415858','MCCZ415893','MCCZ418125','MCCZ418131','MCCZ419814','MCCZ420630',
    'MCCZ421043','MCCZ421044','MCCZ421045','MCCZ421666','MCCZ421668','MCCZ421682',
    'MCCZ421683','MCCZ421700','MCCZ421702','MCCZ421704','MCCZ421722','MCCZ421724',
    'MCCZ421725','MCCZ421728','MCCZ421729','MCCZ421731','MCCZ421732','MCCZ421735',
    'MCCZ421736','MCCZ421737','MCCZ421738','MCCZ421749','MCCZ421751','MCCZ421752',
    'MCCZ421769','MCCZ421787','MCCZ421788','MCCZ421789',

    'MCCZ422794','MCCZ422797','MCCZ422801','MCCZ422803','MCCZ422812','MCCZ422813',
    'MCCZ422831','MCCZ422834','MCCZ422838','MCCZ422852','MCCZ422854','MCCZ422856',

    'MCCZ424416','MCCZ424431','MCCZ424551','MCCZ424623','MCCZ425625','MCCZ425718',
    'MCCZ426185','MCCZ426561','MCCZ426563','MCCZ426565','MCCZ426829','MCCZ426834',
    'MCCZ426872','MCCZ426873','MCCZ426876','MCCZ427160',

    'MCCZ450026','MCCZ450086','MCCZ450090','MCCZ450093','MCCZ450109','MCCZ450134',
    'MCCZ450140','MCCZ450157','MCCZ450294','MCCZ450412',

    'MCCZ451140','MCCZ451176','MCCZ451331','MCCZ451332','MCCZ451334','MCCZ451335',
    'MCCZ451336','MCCZ451337','MCCZ451338','MCCZ451339','MCCZ451340','MCCZ451341',
    'MCCZ451343','MCCZ451344','MCCZ451345','MCCZ451346','MCCZ451347','MCCZ451348',
    'MCCZ451349','MCCZ451350','MCCZ451351','MCCZ451352','MCCZ451353','MCCZ451354',
    'MCCZ451355','MCCZ451356','MCCZ451357','MCCZ451358','MCCZ451359','MCCZ451360',
    'MCCZ451361','MCCZ451362','MCCZ451363','MCCZ451364','MCCZ451365','MCCZ451366',
    'MCCZ451367','MCCZ451368','MCCZ451369','MCCZ451370','MCCZ451418','MCCZ451442',
    'MCCZ451448','MCCZ451466','MCCZ451471','MCCZ451575','MCCZ451622','MCCZ452109',
    'MCCZ452915','MCCZ452951',

    'MCCZ641172','MCCZ641183','MCCZ641185','MCCZ641187','MCCZ641192','MCCZ641193',
    'MCCZ641194','MCCZ641195','MCCZ641196','MCCZ641197','MCCZ641198','MCCZ641199',
    'MCCZ641200','MCCZ641201','MCCZ641203','MCCZ641204','MCCZ641205','MCCZ641206',
    'MCCZ641207','MCCZ641208',

    'MCHZ300007','MCHZ300014','MCHZ300171','MCHZ300173','MCHZ300219','MCHZ300223',
    'MCHZ400241','MCHZ400576','MCHZ401647',
}


# ── PROGRESS BAR (no external deps) ───────────────────────────────────────────

def print_progress(current: int, total: int, prefix: str = "", width: int = 35):
    """Overwrite the current terminal line with a live progress bar."""
    filled = int(width * current / total) if total else 0
    bar    = "#" * filled + "." * (width - filled)
    pct    = int(100 * current / total) if total else 0
    line   = f"  [{bar}] {current}/{total} ({pct}%)  {prefix}"
    sys.stdout.write(f"\r{line}")
    sys.stdout.flush()


# ── OAUTH AUTH FLOW ────────────────────────────────────────────────────────────

class RadarAuth:
    """Handles JWT creation, OAuth token exchange, and auto-refresh."""

    def __init__(self, app_id: str, private_key: str):
        self.app_id        = app_id
        self.private_key   = private_key
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
        """Return cached token or fetch a new one if expired/missing."""
        if self._access_token and time.time() < self._token_expiry - 30:
            return self._access_token

        client_jwt = self._make_client_jwt()
        resp = None
        for attempt in range(5):
            try:
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
                break
            except requests.RequestException as e:
                print(f"\n  Network error (token fetch attempt {attempt+1}/5): {e}")
                if attempt < 4:
                    time.sleep(10 * (attempt + 1))
                else:
                    raise

        if resp is None or resp.status_code != 200:
            raise RuntimeError(
                f"OAuth token exchange failed: "
                f"{resp.status_code if resp else 'no response'} "
                f"{resp.text[:300] if resp else ''}"
            )

        data               = resp.json()
        self._access_token = data["access_token"]
        expires_in         = data.get("expires_in", 300)
        self._token_expiry = time.time() + expires_in
        print(f"\n  ✅ Access token obtained (expires in {expires_in}s)")
        return self._access_token

    def headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Accept":        "application/json",
            "Content-Type":  "application/json",
        }


# ── TABLE DDL ──────────────────────────────────────────────────────────────────

def setup_tables(conn, table: str):
    tbl = table.replace("blackberry_", "").replace("_gps", "")
    stmts = [
        # Assets
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

        # Distance history
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

        # Seed progress tracker — shared across both accounts, enables full resumability
        """CREATE TABLE IF NOT EXISTS bb_distance_seed_progress (
            id               bigserial PRIMARY KEY,
            account          text NOT NULL,
            identifier       text NOT NULL,
            window_start_ms  bigint NOT NULL,
            window_end_ms    bigint NOT NULL,
            status           text NOT NULL DEFAULT 'pending',
            drive_distance_m bigint,
            completed_at     timestamptz,
            UNIQUE(account, identifier, window_start_ms)
        )""",
        "CREATE INDEX IF NOT EXISTS idx_bb_seed_prog "
        "ON bb_distance_seed_progress(account, identifier, status)",

        # GPS events
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
        f"CREATE INDEX IF NOT EXISTS idx_{tbl}_repair   ON {table}(is_repair_chassis, recorded_on) "
        f"WHERE is_repair_chassis = true",
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
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE gps_sync_log SET
                status        = 'failed',
                completed_at  = now(),
                error_message = %s
            WHERE id = %s
        """, (error_message[:500], sync_id))
    conn.commit()


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
            print(f"\n    Network error: {e}")
            time.sleep(5)
            continue

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", r.headers.get("X-RateLimit-Reset", 5)))
            print(f"\n    Rate limited — waiting {wait}s...")
            time.sleep(wait)
            continue
        if r.status_code == 401:
            print(f"\n    401: {r.text[:200]}")
            auth._token_expiry = 0
            continue
        if r.status_code == 404:
            return None
        if r.status_code != 200:
            print(f"\n    HTTP {r.status_code}: {r.text[:200]}")
            return None

        time.sleep(int(r.headers.get("X-RateLimit-Reset", 1)))
        return r.json()
    return None


# ── PHASE 1 HELPERS: SEED PROGRESS ────────────────────────────────────────────

def seed_progress_load(conn, account: str, identifier: str, chunks: list) -> set:
    """
    Ensure a progress row exists for every chunk, then return the set of
    window_start_ms values already marked 'done'.
    """
    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO bb_distance_seed_progress
                (account, identifier, window_start_ms, window_end_ms, status)
            VALUES %s
            ON CONFLICT (account, identifier, window_start_ms) DO NOTHING
        """, [(account, identifier, s, e, 'pending') for s, e in chunks])
        conn.commit()

        cur.execute("""
            SELECT window_start_ms FROM bb_distance_seed_progress
            WHERE account = %s AND identifier = %s AND status = 'done'
        """, (account, identifier))
        return {row[0] for row in cur.fetchall()}


def seed_progress_mark_done(conn, account: str, identifier: str,
                             window_start_ms: int, drive_distance_m):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE bb_distance_seed_progress
            SET status = 'done', drive_distance_m = %s, completed_at = now()
            WHERE account = %s AND identifier = %s AND window_start_ms = %s
        """, (drive_distance_m, account, identifier, window_start_ms))
    conn.commit()


# ── PHASE 1: ASSETS + DISTANCE (RESUMABLE) ────────────────────────────────────

def phase1(account_name: str, config: dict, conn, auth: RadarAuth) -> dict:
    print(f"\n── Phase 1: Assets + Distance History [{account_name.upper()}] ──")
    table = config["table"]

    # Fetch all assets
    data = api_get(auth, "/assets", {"size": 10000, "from": 0})
    if data is None:
        print("  Could not fetch assets.")
        return {}

    assets       = data if isinstance(data, list) else data.get("items", [])
    repair_found = []
    uuid_map     = {}

    for a in assets:
        identifier = (a.get("identifier") or "").strip().replace(" ", "")
        asset_uuid = a.get("asset_id") or a.get("id")
        if not asset_uuid:
            continue
        is_repair = identifier in REPAIR_CHASSIS
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
                    identifier = EXCLUDED.identifier,
                    loaded_at  = now()
            """, (asset_uuid, identifier, a.get("type"), a.get("asset_class"),
                  json.dumps(a.get("sensors", [])), a.get("initial_distance"),
                  is_repair, json.dumps(a)))
        conn.commit()

    print(f"  Total assets in account : {len(assets)}")
    print(f"  Repair chassis found    : {len(repair_found)}")
    config['_repair_found_count'] = len(repair_found)
    config['_assets_found_count'] = len(assets)

    if not repair_found:
        return uuid_map

    # Build chunk list (single 59-day chunk with current config)
    chunks = []
    s = HISTORY_START_MS
    while s < HISTORY_END_MS:
        e = min(s + CHUNK_MS, HISTORY_END_MS)
        chunks.append((s, e))
        s = e
    total_chunks = len(chunks)
    print(f"  Chunk window            : {total_chunks} x up-to-59-day chunk(s)")

    def ms_to_dt(ms):
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc) if ms else None

    # Pre-flight: which chassis still need work?
    needs_work = []
    for identifier in sorted(repair_found):
        done = seed_progress_load(conn, account_name, identifier, chunks)
        if len(done) < total_chunks:
            needs_work.append(identifier)

    already_complete = len(repair_found) - len(needs_work)
    print(f"  Already complete        : {already_complete} chassis (skipping)")
    print(f"  Need seeding            : {len(needs_work)} chassis")

    if not needs_work:
        print("  Nothing to do — all repair chassis have full distance history.")
        config['_chunks_total']  = len(repair_found) * total_chunks
        config['_chunks_loaded'] = len(repair_found) * total_chunks
        return uuid_map

    # Seed loop with live progress bar
    print()
    total_chunks_loaded = already_complete * total_chunks

    for chassis_idx, identifier in enumerate(sorted(needs_work), start=1):
        asset_uuid = uuid_map.get(identifier)
        if not asset_uuid:
            print(f"\n  WARNING: no UUID for {identifier}, skipping.")
            continue

        done_set       = seed_progress_load(conn, account_name, identifier, chunks)
        pending_chunks = [(s, e) for s, e in chunks if s not in done_set]
        total_drive_m  = 0

        for chunk_idx, (chunk_start, chunk_end) in enumerate(pending_chunks, start=1):
            prefix = (f"chassis {chassis_idx}/{len(needs_work)}  "
                      f"chunk {chunk_idx}/{len(pending_chunks)}  [{identifier}]")
            print_progress(chassis_idx - 1, len(needs_work), prefix)

            dist = api_get(auth, f"/assets/{asset_uuid}/distance", {
                "gte": chunk_start,
                "lte": chunk_end,
            })

            if dist is None:
                print(f"\n  WARNING: no data for {identifier} "
                      f"chunk {chunk_start}-{chunk_end}. Will retry next run.")
                continue

            drive_m        = dist.get("drive_distance") or 0
            total_drive_m += drive_m

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

            seed_progress_mark_done(conn, account_name, identifier, chunk_start, drive_m)
            total_chunks_loaded += 1

        total_drive_mi = round(total_drive_m / 1609.34, 1)
        print(f"\n  ✔ {identifier}: {total_drive_mi} mi  "
              f"({len(pending_chunks)}/{total_chunks} chunks seeded this run)")

    # Final completed bar
    print_progress(len(needs_work), len(needs_work), "complete")
    print()

    config['_chunks_total']  = len(repair_found) * total_chunks
    config['_chunks_loaded'] = total_chunks_loaded
    return uuid_map


# ── PHASE 2: STREAM DRAIN ──────────────────────────────────────────────────────

def parse_item(item: dict) -> dict:
    v       = item.get("values", {})
    chassis = ((v.get("asset", {}).get("params", {}).get("identifier")
                or v.get("identifier") or "").strip().replace(" ", "")) or None
    geo     = v.get("geo_location", {})
    fences  = v.get("geofences", [])
    ms      = item.get("recorded_on", 0)
    return {
        "device_id":         item.get("device_id"),
        "event_type":        item.get("id"),
        "recorded_on":       datetime.fromtimestamp(ms / 1000, tz=timezone.utc) if ms else None,
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
        "is_repair_chassis": chassis in REPAIR_CHASSIS if chassis else False,
        "raw_values":        json.dumps(v),
    }


def phase2(account_name: str, config: dict, conn, auth: RadarAuth):
    print(f"\n── Phase 2: Stream Drain [{account_name.upper()}] ──")
    table      = config["table"]
    token_file = config["token_file"]

    total_inserted = 0
    total_items    = 0
    batch_num      = 0
    repair_seen    = set()

    while True:
        batch_num += 1
        try:
            r = requests.get(
                f"{BASE_URL}/assets/data",
                headers=auth.headers(),
                timeout=30,
            )
        except requests.RequestException as e:
            print(f"  Network error: {e}")
            break

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", r.headers.get("X-RateLimit-Reset", 5)))
            print(f"  Rate limited — {wait}s...")
            time.sleep(wait)
            continue
        if r.status_code == 401:
            print(f"  401: {r.text[:200]}")
            auth._token_expiry = 0
            continue
        if r.status_code != 200:
            print(f"  HTTP {r.status_code}: {r.text[:200]}")
            break

        data  = r.json()
        items = data.get("items", [])
        token = data.get("token")

        if not items:
            print("  Stream empty — backlog fully consumed.")
            break

        parsed = [parse_item(i) for i in items]
        cols   = ["device_id", "event_type", "recorded_on", "recorded_on_ms",
                  "chassis_number", "lat", "lon", "geofence_id", "geofence_name",
                  "velocity", "battery_state", "container_mounted", "event_subtype",
                  "fence_id", "is_repair_chassis", "raw_values"]
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

        if token and token[0] is not None:
            with open(token_file, "w") as f:
                json.dump({"token": token, "saved_at": datetime.now().isoformat()}, f, indent=2)

        if batch_num % 10 == 0 or len(items) < 20:
            print(f"  Batch {batch_num:04d} | {len(items):4d} items | "
                  f"{total_inserted:7d} inserted | repair seen: {len(repair_seen)}")

        time.sleep(int(r.headers.get("X-RateLimit-Reset", 5)))

    print(f"\n  Done [{account_name.upper()}]: {batch_num} batches | "
          f"{total_items} items | {total_inserted} inserted")
    print(f"  Repair chassis in stream: {len(repair_seen)}")
    if repair_seen:
        print(f"  {sorted(repair_seen)}")
    print("  ⚠️  Stream NOT acknowledged. Run acknowledge_tokens.py when confirmed.")
    config['_rows_inserted'] = total_inserted


# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    print("BlackBerry Radar GPS Ingestion")
    print(f"  GAP_FILL_PHASE1: True (resumable via bb_distance_seed_progress)")
    print(f"  SKIP_PHASE2:     False")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Validate PEM keys loaded from .env.local before attempting any API calls
    _check_pem("BB_TRAN_KEY", ACCOUNTS["tran"]["private_key"])
    _check_pem("BB_LOG_KEY",  ACCOUNTS["log"]["private_key"])

    try:
        conn = psycopg2.connect(
            DB_URL,
            keepalives=1,
            keepalives_idle=60,
            keepalives_interval=10,
            keepalives_count=5,
        )
        print("Database connected (with keepalives).")
    except Exception as e:
        print(f"DB connection failed: {e}")
        return

    for name, config in ACCOUNTS.items():
        print(f"\n{'='*60}\nACCOUNT: {name.upper()}\n{'='*60}")
        sync_id = -1
        try:
            auth = RadarAuth(config["app_id"], config["private_key"])
            setup_tables(conn, config["table"])
            sync_id = log_sync_start(conn, name)
            phase1(name, config, conn, auth)
            phase2(name, config, conn, auth)
            log_sync_complete(
                conn, sync_id, name,
                assets_found  = config.get('_assets_found_count', 0),
                repair_found  = config.get('_repair_found_count', 0),
                rows_inserted = config.get('_rows_inserted', 0),
                chunks_total  = config.get('_chunks_total', 0),
                chunks_loaded = config.get('_chunks_loaded', 0),
            )
        except KeyboardInterrupt:
            print(f"\nInterrupted during {name} — progress saved to bb_distance_seed_progress.")
            if sync_id > 0:
                log_sync_failed(conn, sync_id, "Interrupted by user")
            break
        except Exception as e:
            import traceback
            print(f"Error in {name}: {e}")
            traceback.print_exc()
            if sync_id > 0:
                log_sync_failed(conn, sync_id, str(e))

    conn.close()
    print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
