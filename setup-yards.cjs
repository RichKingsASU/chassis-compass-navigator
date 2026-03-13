// setup-yards.cjs — Creates yard tables and seeds demo data via Supabase SQL API
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node setup-yards.cjs

const https = require('https');
const http = require('http');
const url = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

// Extract project ref from URL for Management API
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const SQL = `
-- ============================================================
-- YARDS: Master configuration table
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
  capacity integer not null default 30,
  daily_rate numeric(10,2) not null default 25.00,
  overage_rate numeric(10,2) not null default 25.00,
  billing_snapshot_am text not null default '08:00',
  billing_snapshot_pm text not null default '20:00',
  timezone text not null default 'America/Los_Angeles',
  active boolean not null default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- YARD INVENTORY
-- ============================================================
create table if not exists yard_inventory (
  id text primary key default 'REC-' || upper(substr(gen_random_uuid()::text, 1, 6)),
  yard_id uuid not null references yards(id) on delete restrict,
  date_in date not null,
  time_in text,
  container_number text,
  chassis_number text not null,
  status text not null,
  bk_seal text,
  spot text,
  chassis_type text,
  ssl_size text,
  account_manager text,
  reserving_entity text,
  inbound_carrier text,
  inbound_driver_name text,
  inbound_plate_cdl text,
  outbound_carrier text,
  planned_exit_date text,
  planned_driver_name text,
  reservation_notes text,
  shop_reason text,
  expected_return_date text,
  actual_exit_at timestamptz,
  exit_recorded_by_user_id text,
  exit_reason text,
  exit_driver_name text,
  exit_plate_cdl text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- YARD AUDIT LOG
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
drop policy if exists "yards_read_all" on yards;
create policy "yards_read_all"   on yards for select using (true);
drop policy if exists "yards_write_auth" on yards;
create policy "yards_write_auth" on yards for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table yard_inventory enable row level security;
drop policy if exists "inventory_read_all" on yard_inventory;
create policy "inventory_read_all"   on yard_inventory for select using (true);
drop policy if exists "inventory_write_auth" on yard_inventory;
create policy "inventory_write_auth" on yard_inventory for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table yard_audit_log enable row level security;
drop policy if exists "audit_read_all" on yard_audit_log;
create policy "audit_read_all"   on yard_audit_log for select using (true);
drop policy if exists "audit_insert_auth" on yard_audit_log;
create policy "audit_insert_auth" on yard_audit_log for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- SEED: Demo Yard A
-- ============================================================
insert into yards (
  name, short_code, address_line1, city, state, zip,
  capacity, daily_rate, overage_rate,
  billing_snapshot_am, billing_snapshot_pm,
  timezone, active, notes
) values (
  'Demo Yard A', 'DEMOA', '100 Industrial Blvd', 'Anytown', 'CA', '90000',
  30, 25.00, 25.00, '08:00', '20:00',
  'America/Los_Angeles', true,
  'Primary demo chassis storage yard'
) on conflict (short_code) do nothing;

-- ============================================================
-- SEED: Demo inventory (generic)
-- ============================================================
do $$
declare v_yard_id uuid;
begin
  select id into v_yard_id from yards where short_code = 'DEMOA';
  insert into yard_inventory (
    id, yard_id, date_in, time_in, container_number, chassis_number,
    status, chassis_type, ssl_size, account_manager,
    inbound_carrier, inbound_driver_name, inbound_plate_cdl,
    shop_reason, planned_exit_date, bk_seal
  ) values
  ('REC-001', v_yard_id, '2026-02-04', '10:54', null,          'DEMO400001', 'SHOP',   'Standard 40', 'Standard 40', '', 'CARRIER-A',  'DRIVER A.',  'XX11111', 'Axle replacement',    '2026-01-28', null),
  ('REC-002', v_yard_id, '2026-02-10', '11:12', null,          'DEMO400002', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Axle replacement',    '2026-01-28', null),
  ('REC-003', v_yard_id, '2026-01-13', '12:35', null,          'DEMO400003', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Axle replacement',    null,         null),
  ('REC-004', v_yard_id, '2026-01-13', '17:15', null,          'DEMO400004', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Axle replacement',    null,         null),
  ('REC-005', v_yard_id, '2026-01-28', '15:05', null,          'DEMO400005', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Axle replacement',    '2026-01-28', null),
  ('REC-006', v_yard_id, '2026-01-23', '13:18', null,          'DEMO400006', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Axle replacement',    '2026-01-28', null),
  ('REC-007', v_yard_id, '2026-02-06', '18:15', null,          'DEMO400007', 'SHOP',   'Standard 40', 'Standard 40', '', 'TEAM1',      'DRIVER B.',  'XX22222', 'Tire replacement and cosmetic repair', null, null),
  ('REC-008', v_yard_id, '2026-02-09', '20:07', null,          'DEMO400008', 'SHOP',   'Standard 40', 'Standard 40', '', 'CARRIER-B',  'DRIVER C.',  'XX33333', 'Cosmetic repair',     null, null),
  ('REC-009', v_yard_id, '2026-02-10', '01:06', null,          'DEMO400009', 'SHOP',   'Standard 40', 'Standard 40', '', 'CARRIER-C',  'DRIVER D.',  'XX44444', 'Cosmetic repair',     null, null),
  ('REC-010', v_yard_id, '2026-02-11', '13:55', null,          'DEMO400010', 'SHOP',   'Standard 40', null,          '', 'CARRIER-D',  'DRIVER E.',  'XX55555', 'General repair',      null, null),
  ('REC-033', v_yard_id, '2026-02-13', '20:49', 'CNTR0001001', 'DEMO400011', 'LOADED', 'Standard 40', 'SSL 40HC',    'TEAM2',     'CARRIER-E',  'DRIVER F.',  'XX66666', 'Brake repair needed', null, 'BK-1001'),
  ('REC-034', v_yard_id, '2026-02-17', '21:10', 'CNTR0002002', 'DEMO400012', 'LOADED', 'Standard 40', null,          '', 'CARRIER-F',  'DRIVER G.',  'XX77777', null,                  null, 'BK-2002'),
  ('REC-035', v_yard_id, '2026-02-18', '00:05', 'CNTR0003003', 'DEMO400013', 'LOADED', 'Standard 40', null,          '', 'CARRIER-F',  'DRIVER G.',  'XX77777', null,                  null, 'BK-3003'),
  ('REC-036', v_yard_id, '2026-02-13', '15:04', 'CNTR0004004', 'DEMO400014', 'EMPTY',  'Triaxle 20',  'SSL 20ST',    'TEAM3',     'TEAM3',      'SYSTEM',     'PENDING', null,        null, null),
  ('REC-037', v_yard_id, '2026-02-17', '17:54', 'CNTR0005005', 'DEMO400015', 'EMPTY',  'Standard 40', 'SSL 40ST',    'TEAM4',     'TEAM4',      'SYSTEM',     'PENDING', null,        null, null),
  ('REC-038', v_yard_id, '2026-02-17', '19:29', 'CNTR0006006', 'DEMO400016', 'EMPTY',  'Standard 40', 'SSL 40HC',    'TEAM4',     'TEAM4',      'SYSTEM',     'PENDING', null,        null, null)
  on conflict (id) do nothing;
end $$;
`;

async function runSQL(sql) {
  const parsed = url.parse(SUPABASE_URL);
  const isHttps = parsed.protocol === 'https:';
  const lib = isHttps ? https : http;

  const postData = JSON.stringify({ query: sql });

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runSQLDirect(sql) {
  // Try the pg-meta SQL endpoint (Supabase built-in)
  const parsed = url.parse(SUPABASE_URL);
  const isHttps = parsed.protocol === 'https:';
  const lib = isHttps ? https : http;

  const postData = JSON.stringify({ query: sql });

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (isHttps ? 443 : 80),
    path: '/pg/query',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' Yard Tables Setup — Supabase Migration');
  console.log('═══════════════════════════════════════════');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log('');

  // Try direct SQL endpoint first
  console.log('Attempting to run migration via SQL endpoint...');
  let result = await runSQLDirect(SQL);

  if (result.status === 200 || result.status === 201) {
    console.log('Migration executed successfully via SQL endpoint!');
    console.log(result.body);
    return;
  }

  console.log(`SQL endpoint returned ${result.status}, trying RPC method...`);

  // Try via RPC
  result = await runSQL(SQL);
  if (result.status === 200 || result.status === 201) {
    console.log('Migration executed successfully via RPC!');
    console.log(result.body);
    return;
  }

  console.log(`RPC returned ${result.status}: ${result.body}`);
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Could not run migration automatically.                 ║');
  console.log('║  Please run the SQL in the migration file manually:     ║');
  console.log('║                                                         ║');
  console.log('║  1. Go to your Supabase Dashboard → SQL Editor          ║');
  console.log('║  2. Paste the contents of:                              ║');
  console.log('║     supabase/migrations/                                ║');
  console.log('║       20240101000006_create_yards_schema.sql            ║');
  console.log('║  3. Click "Run"                                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
