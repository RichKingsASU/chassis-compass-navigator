-- ============================================================
-- Migration: Create chassis_repairs table
-- Description: Tracks repair costs per chassis
-- ============================================================

CREATE TABLE IF NOT EXISTS chassis_repairs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chassis_number  TEXT NOT NULL,
  repair_date     DATE NOT NULL,
  repair_type     TEXT NOT NULL,
  description     TEXT,
  vendor          TEXT,
  cost            NUMERIC(10,2) NOT NULL DEFAULT 0,
  invoice_number  TEXT,
  yard            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chassis_repairs_chassis ON chassis_repairs(chassis_number);
CREATE INDEX IF NOT EXISTS idx_chassis_repairs_date    ON chassis_repairs(repair_date);
CREATE INDEX IF NOT EXISTS idx_chassis_repairs_type    ON chassis_repairs(repair_type);

ALTER TABLE chassis_repairs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "chassis_repairs_read_all"   ON chassis_repairs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "chassis_repairs_write_auth" ON chassis_repairs FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
