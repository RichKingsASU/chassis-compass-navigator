create table if not exists public."fleetview_daily_asset_report" (
  id uuid primary key default gen_random_uuid(),
  "asset_id" text, -- Asset ID
  "group" text, -- Group
  "status" text, -- Status
  "duration" text, -- Duration
  "location" text, -- Location
  "landmark" text, -- Landmark
  "address" text, -- Address
  "city" text, -- City
  "state" text, -- State
  "zip" bigint, -- Zip
  "last_event_date" text, -- Last Event Date
  "serial_number" text, -- Serial Number
  "device" text, -- Device
  "battery_status" text, -- Battery Status
  inserted_at timestamptz not null default now(),
  source_file text
);

alter table public."fleetview_daily_asset_report" enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fleetview_daily_asset_report' and policyname='read_authed') then
    create policy read_authed on public."fleetview_daily_asset_report" for select using (auth.role() = 'authenticated');
  end if;
end $$;