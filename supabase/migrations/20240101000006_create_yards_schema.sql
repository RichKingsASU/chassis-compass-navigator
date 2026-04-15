-- ============================================================
-- YARDS: Master configuration table (one row per physical yard)
-- ============================================================
create table if not exists yards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text not null unique,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,

  -- Billing configuration
  capacity integer not null default 30,
  daily_rate numeric(10,2) not null default 25.00,
  overage_rate numeric(10,2) not null default 25.00,
  billing_snapshot_am text not null default '08:00',
  billing_snapshot_pm text not null default '20:00',

  -- Display / metadata
  timezone text not null default 'America/Los_Angeles',
  active boolean not null default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- YARD INVENTORY: One row per chassis/container currently or
-- historically in a yard
-- ============================================================
create table if not exists yard_inventory (
  id text primary key default 'REC-' || upper(substr(gen_random_uuid()::text, 1, 6)),
  yard_id uuid not null references yards(id) on delete restrict,

  -- Ingate details
  date_in date not null,
  time_in text,
  container_number text,
  chassis_number text not null,
  status text not null,
  bk_seal text,
  spot text,

  -- Classification
  chassis_type text,
  ssl_size text,
  account_manager text,
  reserving_entity text,

  -- Carrier details (inbound)
  inbound_carrier text,
  inbound_driver_name text,
  inbound_plate_cdl text,

  -- Carrier details (outbound / planned)
  outbound_carrier text,
  planned_exit_date text,
  planned_driver_name text,
  reservation_notes text,

  -- Shop / maintenance
  shop_reason text,
  expected_return_date text,

  -- Exit details (filled when status = EXITED)
  actual_exit_at timestamptz,
  exit_recorded_by_user_id text,
  exit_reason text,
  exit_driver_name text,
  exit_plate_cdl text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- YARD AUDIT LOG: Tamper-evident log of every change
-- ============================================================
create table if not exists yard_audit_log (
  id text primary key default 'AUD-' || upper(substr(gen_random_uuid()::text, 1, 8)),
  yard_id uuid references yards(id),
  record_id text references yard_inventory(id),
  actor_user_id text not null,
  actor_role text not null,
  timestamp timestamptz default now(),
  action_type text not null,
  changed_fields jsonb default '{}',
  reason text
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table yards enable row level security;
create policy "yards_read_all"   on yards for select using (true);
create policy "yards_write_auth" on yards for all   using (auth.role() = 'authenticated');

alter table yard_inventory enable row level security;
create policy "inventory_read_all"   on yard_inventory for select using (true);
create policy "inventory_write_auth" on yard_inventory for all   using (auth.role() = 'authenticated');

alter table yard_audit_log enable row level security;
create policy "audit_read_all"   on yard_audit_log for select using (true);
create policy "audit_insert_auth" on yard_audit_log for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- SEED: Insert the 17th ST Yard as the first yard
-- ============================================================
insert into yards (
  name, short_code, address_line1, city, state, zip,
  capacity, daily_rate, overage_rate,
  billing_snapshot_am, billing_snapshot_pm,
  timezone, active, notes
) values (
  '17th ST Yard',
  '17TH',
  '17th Street',
  'Long Beach',
  'CA',
  '90813',
  30,
  25.00,
  25.00,
  '08:00',
  '20:00',
  'America/Los_Angeles',
  true,
  'Primary chassis storage yard - Forrest Transportation'
) on conflict (short_code) do nothing;

-- ============================================================
-- SEED: Demo inventory data
-- ============================================================
do $$
declare
  v_yard_id uuid;
begin
  select id into v_yard_id from yards where short_code = '17TH';

  insert into yard_inventory (
    id, yard_id, date_in, time_in, container_number, chassis_number,
    status, chassis_type, ssl_size, account_manager,
    inbound_carrier, inbound_driver_name, inbound_plate_cdl,
    shop_reason, planned_exit_date, bk_seal
  ) values
  ('REC-001', v_yard_id, '2026-02-04', '10:54', null,          'FRQZ400064', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'ZP05698',       'CARLOS M.',    'CA12345', 'OUT OF SERVICE SWAP AXLE', '2026-01-28', null),
  ('REC-002', v_yard_id, '2026-02-10', '11:12', null,          'FRQZ400048', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'OUT OF SERVICE SWAP AXLE', '2026-01-28', null),
  ('REC-003', v_yard_id, '2026-01-13', '12:35', null,          'FRQZ400084', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'OUT OF SERVICE SWAP AXLE', null,         null),
  ('REC-004', v_yard_id, '2026-01-13', '17:15', null,          'FRQZ400063', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'OUT OF SERVICE SWAP AXLE', null,         null),
  ('REC-005', v_yard_id, '2026-01-28', '15:05', null,          'MCCZ410500', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'OUT OF SERVICE SWAP AXLE', '2026-01-28', null),
  ('REC-006', v_yard_id, '2026-01-23', '13:18', null,          'MCCZ410529', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'OUT OF SERVICE SWAP AXLE', '2026-01-28', null),
  ('REC-007', v_yard_id, '2026-02-06', '18:15', null,          'MCCZ404477', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'JED',           'SAM P.',       'TX99881', 'Remove decals, LOF LOR ROR and RIR Tires, Paint bolsters', null, null),
  ('REC-008', v_yard_id, '2026-02-09', '20:07', null,          'MCCZ408277', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'NEXGEN',        'ROBERTO L.',   'NV44552', 'Remove Decals, Paint bolsters', null, null),
  ('REC-009', v_yard_id, '2026-02-10', '01:06', null,          'MCCZ407668', 'SHOP',      'FORREST 40', 'FORREST 40',  '',          'BRIANA',        'MARCO S.',     'CA77881', 'Remove decals, Paint bolsters', null, null),
  ('REC-010', v_yard_id, '2026-02-11', '13:55', null,          'MCCZ407980', 'SHOP',      'FORREST 40', null,          '',          'Z LINE',        'ZACH T.',      'AZ88123', 'NEEDS REPAIR', null, null),
  ('REC-033', v_yard_id, '2026-02-13', '20:49', 'CMAU4785508', 'FRQZ400041', 'LOADED',    'FORREST 40', 'CMA 40HC',    'CROCS TEAM','FOREST',        'DANNY G.',     'CA44556', 'NEEDS CHASSIS BRAKE REPAIR', null, 'L4808147'),
  ('REC-034', v_yard_id, '2026-02-17', '21:10', 'FFAU6403819', 'MCCZ422838', 'LOADED',    'FORREST 40', null,          '',          'RELIABLE ROAD', 'ESTEBAN R.',   'CA66778', null, null, 'VN35755AP'),
  ('REC-035', v_yard_id, '2026-02-18', '00:05', 'TCNU8875750', 'MCCZ410496', 'LOADED',    'FORREST 40', null,          '',          'RELIABLE ROAD', 'ESTEBAN R.',   'CA66778', null, null, 'VN37789AO'),
  ('REC-036', v_yard_id, '2026-02-13', '15:04', 'BEAU2655637', 'MCHZ300219', 'EMPTY',     'FORREST 20 TRIAXLE', 'KMD 20ST', 'LEO',  'LEO',          'SYSTEM ENTRY', 'PENDING', null, null, null),
  ('REC-037', v_yard_id, '2026-02-17', '17:54', 'DFSU4273394', 'PTAZ401581', 'EMPTY',     'FORREST 40', 'CMA 40ST',    'EFL TEAM',  'EFL TEAM',      'SYSTEM ENTRY', 'PENDING', null, null, null),
  ('REC-038', v_yard_id, '2026-02-17', '19:29', 'SEGU4305183', 'MCCZ411502', 'EMPTY',     'FORREST 40', 'ONE 40HC',    'EFL TEAM',  'EFL TEAM',      'SYSTEM ENTRY', 'PENDING', null, null, null)
  on conflict (id) do nothing;

end $$;

