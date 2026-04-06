#!/usr/bin/env python3
"""
Backfill missing lat/lng on fleetlocate_gps records.

In this repo, fleetlocate_gps already has latitude/longitude columns, but
some landmark-only rows may be NULL. This script tries to fill those from
two optional sources (master_geo, canonical_dataset) if they exist. Tables
that don't exist are skipped gracefully so the script is idempotent.

Usage:
    $env:SUPABASE_DB_USER="postgres.bribgwhzbvktheayahxu"
    $env:SUPABASE_DB_PASS="<db-password>"
    python scripts/geocode_fleetlocate.py
"""

from __future__ import annotations

import os
import sys

import psycopg2  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()

DB_HOST = os.getenv("SUPABASE_DB_HOST", "aws-0-us-west-1.pooler.supabase.com")
DB_PORT = os.getenv("SUPABASE_DB_PORT", "6543")
DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
DB_USER = os.getenv("SUPABASE_DB_USER")
DB_PASS = os.getenv("SUPABASE_DB_PASS")


def table_exists(cur, name: str) -> bool:
    cur.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s",
        (name,),
    )
    return cur.fetchone() is not None


def column_exists(cur, table: str, column: str) -> bool:
    cur.execute(
        """
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s AND column_name=%s
        """,
        (table, column),
    )
    return cur.fetchone() is not None


def main() -> int:
    if not DB_USER or not DB_PASS:
        print("Missing SUPABASE_DB_USER / SUPABASE_DB_PASS env vars.")
        return 1

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode="require",
    )

    with conn.cursor() as cur:
        if not table_exists(cur, "fleetlocate_gps"):
            print("fleetlocate_gps table not found; nothing to do.")
            return 0

        # Add bookkeeping column if missing
        cur.execute(
            "ALTER TABLE fleetlocate_gps ADD COLUMN IF NOT EXISTS geocoded_source text;"
        )
        conn.commit()

        # Count NULL lat/lng rows
        cur.execute(
            "SELECT COUNT(*) FROM fleetlocate_gps WHERE latitude IS NULL OR longitude IS NULL"
        )
        null_rows = cur.fetchone()[0]
        print(f"fleetlocate_gps rows with NULL lat/lng: {null_rows}")

        if null_rows == 0:
            print("Nothing to backfill.")
            return 0

        filled = 0

        # Source 1: canonical_dataset (if present)
        if table_exists(cur, "canonical_dataset"):
            print("Trying canonical_dataset match on location_name ...")
            cur.execute(
                """
                UPDATE fleetlocate_gps f
                SET latitude        = c."Latitude"::numeric,
                    longitude       = c."Longitude"::numeric,
                    geocoded_source = 'canonical_dataset'
                FROM canonical_dataset c
                WHERE (f.latitude IS NULL OR f.longitude IS NULL)
                  AND f.location_name IS NOT NULL
                  AND LOWER(TRIM(f.location_name)) = LOWER(TRIM(c."Name"))
                  AND c."Latitude"  IS NOT NULL
                  AND c."Longitude" IS NOT NULL;
                """
            )
            print(f"  filled {cur.rowcount} from canonical_dataset")
            filled += cur.rowcount
            conn.commit()
        else:
            print("canonical_dataset not present; skipping.")

        # Source 2: master_geo (if present)
        if table_exists(cur, "master_geo"):
            print("Trying master_geo match on location_name ...")
            cur.execute(
                """
                UPDATE fleetlocate_gps f
                SET latitude        = m.latitude,
                    longitude       = m.longitude,
                    geocoded_source = 'master_geo'
                FROM master_geo m
                WHERE (f.latitude IS NULL OR f.longitude IS NULL)
                  AND f.location_name IS NOT NULL
                  AND LOWER(TRIM(f.location_name)) = LOWER(TRIM(m.name))
                  AND m.latitude  IS NOT NULL
                  AND m.longitude IS NOT NULL;
                """
            )
            print(f"  filled {cur.rowcount} from master_geo")
            filled += cur.rowcount
            conn.commit()
        else:
            print("master_geo not present; skipping.")

        cur.execute(
            "SELECT COUNT(*) FROM fleetlocate_gps WHERE latitude IS NULL OR longitude IS NULL"
        )
        remaining = cur.fetchone()[0]
        print(f"\nFilled: {filled}")
        print(f"Remaining NULL lat/lng: {remaining}")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
