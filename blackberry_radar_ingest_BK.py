"""
BlackBerry Radar GPS Data Ingestion
====================================
Correct auth flow:
  1. Build JWT with jti/iss/sub/aud/iat/exp claims
  2. POST to OAuth server to exchange for access token
  3. Use access token as Bearer for all API calls
  4. Auto-refresh token before expiry

Run from PowerShell:
    python blackberry_radar_ingest.py
"""

import jwt, time, json, requests, psycopg2, psycopg2.extras, os, uuid
from datetime import datetime, timezone

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
    },
}

# History window — pull only the last 59 days (within API's 61-day chunk max)
HISTORY_START_MS  = int((datetime.now(tz=timezone.utc).timestamp() - 59 * 24 * 60 * 60) * 1000)
HISTORY_END_MS    = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
CHUNK_MS          = 59 * 24 * 60 * 60 * 1000   # 59 days in ms (single chunk)

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
    'MCHZ400241','MCHZ400576','MCHZ401647'
}

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
        """Return cached token or fetch a new one if expired."""
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
    """Insert a 'running' record and return its ID."""
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
            print(f"    Network error: {e}"); time.sleep(5); continue

        if r.status_code == 429:
            wait = int(r.headers.get("Retry-After", r.headers.get("X-RateLimit-Reset", 5)))
            print(f"    Rate limited — waiting {wait}s..."); time.sleep(wait); continue
        if r.status_code == 401:
            print(f"    401: {r.text[:200]}")
            # Force token refresh on next call
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

def phase1(account_name, config, conn, auth):
    print(f"\n── Phase 1: Assets + Distance History [{account_name.upper()}] ──")
    table = config["table"]

    data = api_get(auth, "/assets", {"size": 10000, "from": 0})
    if data is None:
        print("  Could not fetch assets."); return {}

    assets = data if isinstance(data, list) else data.get("items", [])
    print(f"  Total assets in account: {len(assets)}")

    uuid_map    = {}
    repair_found = []

    for a in assets:
        identifier = (a.get("identifier") or "").strip().replace(" ", "")
        uuid       = a.get("asset_id") or a.get("id")
        if not uuid: continue
        is_repair  = identifier in REPAIR_CHASSIS
        if is_repair: repair_found.append(identifier)
        uuid_map[identifier] = uuid

        with conn.cursor() as cur:
            cur.execute(f"""
                INSERT INTO {table}_assets
                    (asset_uuid, identifier, asset_type, asset_class, sensors,
                     initial_distance_m, is_repair_chassis, raw)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (asset_uuid) DO UPDATE SET
                    identifier=EXCLUDED.identifier, loaded_at=now()
            """, (uuid, identifier, a.get("type"), a.get("asset_class"),
                  json.dumps(a.get("sensors",[])), a.get("initial_distance"),
                  is_repair, json.dumps(a)))
        conn.commit()

    print(f"  Repair chassis in this account: {len(repair_found)}")
    if repair_found: print(f"  {sorted(repair_found)}")
    config['_repair_found_count'] = len(repair_found)
    config['_assets_found_count'] = len(assets)

    # Build 61-day chunks from activation floor to today
    chunks = []
    s = HISTORY_START_MS
    while s < HISTORY_END_MS:
        e = min(s + CHUNK_MS, HISTORY_END_MS)
        chunks.append((s, e))
        s = e
    print(f"\n  Pulling distance history in {len(chunks)} x 61-day chunks...")

    def ms_to_dt(ms):
        return datetime.fromtimestamp(ms/1000, tz=timezone.utc) if ms else None

    for identifier in sorted(repair_found):
        uuid = uuid_map[identifier]
        total_drive_m = 0
        chunks_loaded = 0

        for chunk_start, chunk_end in chunks:
            dist = api_get(auth, f"/assets/{uuid}/distance", {
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
                """, (uuid, identifier,
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

def parse_item(item):
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
        "is_repair_chassis": chassis in REPAIR_CHASSIS if chassis else False,
        "raw_values":        json.dumps(v),
    }


def phase2(account_name, config, conn, auth):
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

        parsed = [parse_item(i) for i in items]
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

        if token and token[0] is not None:
            with open(token_file, "w") as f:
                json.dump({"token": token, "saved_at": datetime.now().isoformat()}, f, indent=2)

        if batch_num % 10 == 0 or len(items) < 20:
            print(f"  Batch {batch_num:04d} | {len(items):4d} items | "
                  f"{total_inserted:6d} inserted | repair seen: {len(repair_seen)}")

        time.sleep(int(r.headers.get("X-RateLimit-Reset", 5)))

    print(f"\n  Done [{account_name.upper()}]: {batch_num} batches | "
          f"{total_items} items | {total_inserted} inserted")
    print(f"  Repair chassis in stream: {len(repair_seen)}")
    if repair_seen: print(f"  {sorted(repair_seen)}")
    print(f"  ⚠️  Stream NOT acknowledged. Run acknowledge_tokens.py when confirmed.")
    config['_rows_inserted'] = total_inserted


# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    print("BlackBerry Radar GPS Ingestion")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    for name, cfg in ACCOUNTS.items():
        if "PASTE" in cfg["private_key"]:
            print(f"\n⛔  {name.upper()} private key not set."); return

    try:
        conn = psycopg2.connect(DB_URL)
        print("Database connected.")
    except Exception as e:
        print(f"DB connection failed: {e}"); return

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
                chunks_total  = 12,
                chunks_loaded = config.get('_repair_found_count', 0) * 12,
            )
        except KeyboardInterrupt:
            print(f"\nInterrupted during {name} — progress saved.")
            if sync_id > 0: log_sync_failed(conn, sync_id, "Interrupted by user")
            break
        except Exception as e:
            import traceback
            print(f"Error in {name}: {e}"); traceback.print_exc()
            if sync_id > 0: log_sync_failed(conn, sync_id, str(e))

    conn.close()
    print(f"\nFinished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
