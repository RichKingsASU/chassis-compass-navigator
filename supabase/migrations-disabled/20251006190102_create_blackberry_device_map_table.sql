-- public.blackberry_device_map: device -> asset mapping
create table if not exists public.blackberry_device_map (
  org_id             uuid        not null,
  external_device_id text        not null,
  asset_id           uuid        not null,
  created_at         timestamptz not null default now(),
  constraint blackberry_device_map_pkey primary key (org_id, external_device_id),
  constraint blackberry_device_map_org_fkey   foreign key (org_id)  references public.orgs(id)   on delete cascade,
  constraint blackberry_device_map_asset_fkey foreign key (asset_id) references public.assets(id) on delete cascade
);

create index if not exists blackberry_device_map_asset_idx
  on public.blackberry_device_map (asset_id);