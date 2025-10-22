-- Destination table for Anytrek
create table if not exists public.gps_anytrek_log (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null default 'anytrek',
  device_id          text not null,
  timestamp_utc      timestamptz not null,
  latitude           double precision not null,
  longitude          double precision not null,
  speed_kph          double precision,
  heading            double precision,
  battery_pct        double precision,
  status             text,
  location_label     text,
  formatted_address  text,
  place_id           text,
  source_file        text,
  raw                jsonb,          -- keep the original row if you like
  inserted_at        timestamptz not null default now()
);

-- Dedupe: Same device + same timestamp only once
create unique index if not exists gps_anytrek_unique
  on public.gps_anytrek_log (device_id, timestamp_utc);

-- Useful geo/time index
create index if not exists gps_anytrek_time_idx
  on public.gps_anytrek_log (timestamp_utc desc);

-- RLS read-only (writes come from service role via the function)
alter table public.gps_anytrek_log enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='gps_anytrek_log'
      and policyname='gps_anytrek_read_authed'
  ) then
    create policy gps_anytrek_read_authed
      on public.gps_anytrek_log
      for select using (auth.role() = 'authenticated');
  end if;
end$$;