-- Table
create table if not exists piers_equipment_inventory (
  id                bigserial primary key,
  equip_group_id    text,
  eq_type           text,
  equip_no          text not null,
  size              integer,
  iso_code          text,
  cust_code         text,
  lic_no            text,
  lic_state         text,
  last_gate_in_date date,
  last_gate_in_time integer,
  load_type         text,
  last_carrier      text,
  last_carrier_name text,
  booking_no        text,
  days_onsite       integer,
  comment           text,
  resource_name     text,
  source_file       text,
  uploaded_at       timestamptz default now(),
  created_at        timestamptz default now()
);

-- Composite unique for upsert
alter table piers_equipment_inventory
  add constraint uq_pier_s_equip unique (equip_no, last_gate_in_time);

-- Upload audit log
create table if not exists pier_s_upload_log (
  id            bigserial primary key,
  file_name     text not null,
  storage_path  text not null,
  row_count     integer,
  error_count   integer,
  warning_count integer,
  info_count    integer,
  uploaded_by   text,
  uploaded_at   timestamptz default now(),
  audit_results jsonb
);

-- RLS
alter table piers_equipment_inventory enable row level security;
alter table pier_s_upload_log enable row level security;
create policy "public read" on piers_equipment_inventory for select using (true);
create policy "public read logs" on pier_s_upload_log for select using (true);
create policy "service insert inventory" on piers_equipment_inventory for insert with check (true);
create policy "service upsert inventory" on piers_equipment_inventory for update using (true);
create policy "service insert logs" on pier_s_upload_log for insert with check (true);
