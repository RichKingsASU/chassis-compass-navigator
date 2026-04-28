-- Provar containers: add columns parsed from the Provar Excel response
-- so common fields are queryable without digging into raw_data jsonb.

ALTER TABLE provar_containers_sheet
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS vessel_name text,
  ADD COLUMN IF NOT EXISTS last_free_day date,
  ADD COLUMN IF NOT EXISTS return_date date;
