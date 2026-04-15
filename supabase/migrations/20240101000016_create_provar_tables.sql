-- Provar Integration tables
-- Stores daily snapshots of container + to-return data pulled from the Provar.io API
-- for each terminal portal (emodal, yti, wbct, lbct, fms, apmt).

-- Containers sheet snapshots per portal
CREATE TABLE IF NOT EXISTS provar_containers_sheet (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  portal text NOT NULL,
  container_number text,
  trade_type text,
  line text,
  raw_data jsonb NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  ingested_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provar_containers_portal ON provar_containers_sheet(portal);
CREATE INDEX IF NOT EXISTS idx_provar_containers_snapshot ON provar_containers_sheet(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_provar_containers_number ON provar_containers_sheet(container_number);

-- To-return sheet snapshots per portal
CREATE TABLE IF NOT EXISTS provar_to_return (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  portal text NOT NULL,
  container_id text,
  return_date date,
  raw_data jsonb NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  ingested_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provar_return_portal ON provar_to_return(portal);
CREATE INDEX IF NOT EXISTS idx_provar_return_snapshot ON provar_to_return(snapshot_date);

-- Sync log
CREATE TABLE IF NOT EXISTS provar_sync_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  portal text NOT NULL,
  endpoint text NOT NULL,
  status text NOT NULL,
  rows_affected integer DEFAULT 0,
  error_message text,
  ran_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provar_log_ran_at ON provar_sync_log(ran_at DESC);

-- Enable RLS but allow all for local dev
ALTER TABLE provar_containers_sheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE provar_to_return ENABLE ROW LEVEL SECURITY;
ALTER TABLE provar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all provar_containers_sheet" ON provar_containers_sheet;
DROP POLICY IF EXISTS "Allow all provar_to_return" ON provar_to_return;
DROP POLICY IF EXISTS "Allow all provar_sync_log" ON provar_sync_log;

CREATE POLICY "Allow all provar_containers_sheet" ON provar_containers_sheet FOR ALL USING (true);
CREATE POLICY "Allow all provar_to_return" ON provar_to_return FOR ALL USING (true);
CREATE POLICY "Allow all provar_sync_log" ON provar_sync_log FOR ALL USING (true);
