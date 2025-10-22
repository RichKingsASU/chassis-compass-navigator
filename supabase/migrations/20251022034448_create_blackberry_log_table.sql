create table if not exists public."GPS_Blackberry_Log" (
  id                 uuid primary key default gen_random_uuid(),
  provider           text not null default 'blackberry',
  device_id          text not null,
  timestamp_utc      timestamptz not null,
  latitude           double precision not null,
  longitude          double precision not null,
  speed_kph          double precision,
  heading            double precision,
  battery_pct        double precision,
  location_label     text,
  formatted_address  text,
  place_id           text,
  source_file        text,
  raw                jsonb,
  inserted_at        timestamptz not null default now()
);

create unique index if not exists gps_bb_unique
  on public."GPS_Blackberry_Log"(device_id, timestamp_utc);

create index if not exists gps_bb_time_idx
  on public."GPS_Blackberry_Log"(timestamp_utc desc);

alter table public."GPS_Blackberry_Log" enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='GPS_Blackberry_Log' and policyname='gps_bb_read_authed'
  ) then
    create policy gps_bb_read_authed
      on public."GPS_Blackberry_Log" for select using (auth.role() = 'authenticated');
  end if;
end$$;