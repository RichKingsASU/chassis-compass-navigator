-- Migration: Create jed_yard_events table with TMS enrichment columns
-- Data loaded separately via jed_yard_events_FINAL.sql

CREATE TABLE IF NOT EXISTS jed_yard_events (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chassis_number_raw      TEXT NOT NULL,
  chassis_number_clean    TEXT,
  is_real_chassis         BOOLEAN NOT NULL DEFAULT false,
  direction               TEXT NOT NULL,
  event_date              DATE,
  event_time              TEXT,
  container_number        TEXT,
  chassis_size_raw        TEXT,
  status_raw              TEXT,
  carrier                 TEXT,
  driver_name             TEXT,
  plate_number            TEXT,
  seal_number             TEXT,
  spot                    TEXT,
  source_sheet            TEXT,
  source_file             TEXT,
  tms_ld_num              TEXT,
  tms_container           TEXT,
  tms_customer            TEXT,
  tms_carrier             TEXT,
  match_confidence        TEXT DEFAULT 'NO_MATCH',
  container_filled_by_tms BOOLEAN DEFAULT false,
  loaded_at               TIMESTAMPTZ DEFAULT now(),
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jed_chassis_clean  ON jed_yard_events(chassis_number_clean);
CREATE INDEX IF NOT EXISTS idx_jed_chassis_raw    ON jed_yard_events(chassis_number_raw);
CREATE INDEX IF NOT EXISTS idx_jed_date           ON jed_yard_events(event_date);
CREATE INDEX IF NOT EXISTS idx_jed_direction      ON jed_yard_events(direction);
CREATE INDEX IF NOT EXISTS idx_jed_real           ON jed_yard_events(is_real_chassis);
CREATE INDEX IF NOT EXISTS idx_jed_container      ON jed_yard_events(container_number);
CREATE INDEX IF NOT EXISTS idx_jed_match          ON jed_yard_events(match_confidence);

ALTER TABLE jed_yard_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Auth read"  ON jed_yard_events FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Auth write" ON jed_yard_events FOR INSERT TO authenticated WITH CHECK (true);
