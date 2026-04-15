#!/usr/bin/env python3
"""
Parse Pier S equipment event CSV files and load them into Supabase.

Pier S files are UTF-16 LE encoded with a `sep=,` first line and then
a header row beginning with `Terminal,`.

Columns:
  Terminal, EventDate, EventTime, ChassisNo, ChassisOwner,
  ContainerNo, ContainerOwner, EventDescription, LicensePlate,
  BookingNo, Condition

Usage (PowerShell):
    $env:SUPABASE_DB_USER="postgres.bribgwhzbvktheayahxu"
    $env:SUPABASE_DB_PASS="<db-password>"
    pip install psycopg2-binary python-dotenv --break-system-packages
    python scripts/parse_pier_s_events.py
"""

from __future__ import annotations

import csv
import glob
import os
import sys
from pathlib import Path

import psycopg2  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()

DB_HOST = os.getenv("SUPABASE_DB_HOST", "aws-0-us-west-1.pooler.supabase.com")
DB_PORT = os.getenv("SUPABASE_DB_PORT", "6543")
DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
DB_USER = os.getenv("SUPABASE_DB_USER")
DB_PASS = os.getenv("SUPABASE_DB_PASS")

# Search for Pier S files in common locations
SEARCH_GLOBS = [
    "Pier_S*.csv",
    "pier-s-yard/Pier_S*.csv",
    "pier-s-yard/*.csv",
    "data/Pier_S*.csv",
]

HEADER_MARKER = "Terminal"


def find_files() -> list[str]:
    found: list[str] = []
    for pattern in SEARCH_GLOBS:
        found.extend(sorted(glob.glob(pattern)))
    # De-dup while preserving order
    seen: set[str] = set()
    out: list[str] = []
    for f in found:
        if f not in seen:
            seen.add(f)
            out.append(f)
    return out


def parse_pier_s_file(filepath: str) -> list[dict]:
    filename = Path(filepath).name
    rows: list[dict] = []

    try:
        with open(filepath, encoding="utf-16-le", errors="replace") as f:
            raw = f.read()
    except Exception as e:
        print(f"  ! Could not open {filename}: {e}")
        return []

    if raw.startswith("\ufeff"):
        raw = raw[1:]

    lines = [ln.strip().strip("\x00") for ln in raw.splitlines()]

    header_idx = None
    for i, line in enumerate(lines):
        if line.startswith(HEADER_MARKER + ",") or line == HEADER_MARKER:
            header_idx = i
            break

    if header_idx is None:
        print(f"  ! No header row found in {filename}, skipping")
        return []

    data_lines = [ln for ln in lines[header_idx:] if ln]
    reader = csv.DictReader(data_lines)

    for row in reader:
        if not row:
            continue
        chassis_no = (row.get("ChassisNo") or "").strip()
        event_date = (row.get("EventDate") or "").strip()
        if not chassis_no or chassis_no.startswith("-"):
            continue
        if not event_date or event_date.startswith("-"):
            continue

        rows.append(
            {
                "Terminal": (row.get("Terminal") or "").strip(),
                "EventDate": event_date,
                "EventTime": (row.get("EventTime") or "").strip(),
                "ChassisNo": chassis_no,
                "ChassisOwner": (row.get("ChassisOwner") or "").strip(),
                "ContainerNo": (row.get("ContainerNo") or "").strip(),
                "ContainerOwner": (row.get("ContainerOwner") or "").strip(),
                "EventDescription": (row.get("EventDescription") or "").strip(),
                "LicensePlate": (row.get("LicensePlate") or "").strip(),
                "BookingNo": (row.get("BookingNo") or "").strip(),
                "Condition": (row.get("Condition") or "").strip(),
                "_source_file": filename,
            }
        )

    return rows


def insert_staging(conn, rows: list[dict], batch_size: int = 500) -> int:
    if not rows:
        return 0

    sql = """
        INSERT INTO pier_s_events_staging (
          "Terminal", "EventDate", "EventTime", "ChassisNo", "ChassisOwner",
          "ContainerNo", "ContainerOwner", "EventDescription", "LicensePlate",
          "BookingNo", "Condition", _source_file
        ) VALUES (
          %(Terminal)s, %(EventDate)s, %(EventTime)s, %(ChassisNo)s, %(ChassisOwner)s,
          %(ContainerNo)s, %(ContainerOwner)s, %(EventDescription)s, %(LicensePlate)s,
          %(BookingNo)s, %(Condition)s, %(_source_file)s
        )
    """
    inserted = 0
    with conn.cursor() as cur:
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            cur.executemany(sql, batch)
            inserted += len(batch)
    conn.commit()
    return inserted


def promote_staging_to_typed(conn) -> int:
    sql = r"""
        INSERT INTO pier_s_events (
          "Terminal", "EventDate", "EventTime", "ChassisNo", "ChassisOwner",
          "ContainerNo", "ContainerOwner", "EventDescription", "LicensePlate",
          "BookingNo", "Condition", _source_file, _load_ts
        )
        SELECT
          "Terminal",
          CASE
            WHEN "EventDate" ~ '^\d{4}-\d{2}-\d{2}$' THEN "EventDate"::date
            WHEN "EventDate" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN TO_DATE("EventDate", 'MM/DD/YYYY')
            ELSE NULL
          END,
          "EventTime",
          TRIM("ChassisNo"),
          TRIM("ChassisOwner"),
          "ContainerNo",
          "ContainerOwner",
          "EventDescription",
          "LicensePlate",
          "BookingNo",
          "Condition",
          _source_file,
          _load_ts
        FROM pier_s_events_staging
        WHERE "ChassisNo" IS NOT NULL AND TRIM("ChassisNo") <> ''
          AND "EventDate" IS NOT NULL AND TRIM("EventDate") <> ''
        ON CONFLICT ("ChassisNo", "EventDate", "EventTime", "EventDescription") DO NOTHING;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        count = cur.rowcount
    conn.commit()
    return count


def main() -> int:
    print("\nPier S Event File Parser\n" + "=" * 32)

    files = find_files()
    if not files:
        patterns = ", ".join(SEARCH_GLOBS)
        print(f"No Pier S files found. Patterns tried: {patterns}")
        return 1

    print(f"Found {len(files)} Pier S file(s)\n")

    if not DB_USER or not DB_PASS:
        print("Missing SUPABASE_DB_USER / SUPABASE_DB_PASS env vars.")
        return 1

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            sslmode="require",
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        return 1

    total_parsed = 0
    total_staged = 0
    for fp in files:
        name = Path(fp).name
        print(f"Processing: {name}")
        rows = parse_pier_s_file(fp)
        print(f"  parsed {len(rows)} rows")
        if rows:
            n = insert_staging(conn, rows)
            print(f"  staged {n} rows")
            total_parsed += len(rows)
            total_staged += n

    print(f"\nTotal parsed: {total_parsed}")
    print(f"Total staged: {total_staged}")

    print("\nPromoting staging -> typed pier_s_events ...")
    promoted = promote_staging_to_typed(conn)
    print(f"Promoted {promoted} new rows")

    conn.close()
    print("\nDone.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
