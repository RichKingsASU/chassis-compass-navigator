// seed.cjs — Supabase demo data seeder
// Requires: @supabase/supabase-js  (npm install @supabase/supabase-js)
// Data file: demo_data_anon.json

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ── CONFIG — set via environment variables ───────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
// ─────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const data = JSON.parse(fs.readFileSync('./demo_data_anon.json', 'utf8'));

async function clearTables() {
  console.log('Clearing existing demo data...');
  // Delete in FK-safe order
  for (const table of ['idle_gaps','mr_events','monthly_stats','loads','chassis']) {
    const { error } = await supabase.from(table).delete().neq('id', 0);
    if (error) console.warn(`  Warning clearing ${table}:`, error.message);
    else console.log(`  ✓ Cleared ${table}`);
  }
}

async function seedChassis(chassisData) {
  console.log('\nSeeding chassis...');
  const rows = Object.values(chassisData).map(c => ({
    chassis_number:       c.chassis_number,
    chassis_type:         c.chassis_type,
    chassis_desc:         c.chassis_desc,
    year:                 c.year,
    color:                c.color,
    total_loads:          c.total_loads,
    total_revenue:        c.total_revenue,
    total_carrier_cost:   c.total_carrier_cost,
    total_margin:         c.total_margin,
    total_miles:          c.total_miles,
    avg_miles_per_load:   c.avg_miles_per_load,
    avg_revenue_per_load: c.avg_revenue_per_load,
    avg_utilization:      c.avg_utilization,
    best_month:           c.best_month,
    best_month_util:      c.best_month_util,
    worst_month:          c.worst_month,
    worst_month_util:     c.worst_month_util,
    first_activity:       c.first_activity || null,
    last_activity:        c.last_activity || null,
    months_active:        c.months_active,
    total_mr_cost:        c.total_mr_cost,
    total_mr_days:        c.total_mr_days,
  }));

  const { error } = await supabase.from('chassis').insert(rows);
  if (error) throw new Error('chassis insert failed: ' + error.message);
  console.log(`  ✓ Inserted ${rows.length} chassis`);
}

async function seedLoads(chassisData) {
  console.log('\nSeeding loads...');
  let total = 0;
  for (const [, c] of Object.entries(chassisData)) {
    const rows = c.loads.map(l => ({
      chassis_number: c.chassis_number,
      ld_num:         l.ld_num,
      container:      l.container,
      container_type: l.container_type,
      customer:       l.customer,
      carrier:        l.carrier,
      pickup_loc:     l.pickup_loc,
      pickup_city:    l.pickup_city,
      pickup_state:   l.pickup_state,
      delivery_loc:   l.delivery_loc,
      delivery_city:  l.delivery_city,
      delivery_state: l.delivery_state,
      pickup_date:    l.pickup_date,
      delivery_date:  l.delivery_date,
      revenue:        l.revenue,
      carrier_cost:   l.carrier_cost,
      miles:          l.miles,
      status:         l.status,
      service:        l.service,
      days_on_load:   l.days_on_load,
    }));

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabase.from('loads').insert(batch);
      if (error) throw new Error(`loads insert failed for ${c.chassis_number}: ` + error.message);
    }
    total += rows.length;
    process.stdout.write(`  ✓ ${c.chassis_number}: ${rows.length} loads\n`);
  }
  console.log(`  Total: ${total} loads inserted`);
}

async function seedMonthlyStats(chassisData) {
  console.log('\nSeeding monthly_stats...');
  let total = 0;
  for (const [, c] of Object.entries(chassisData)) {
    const rows = Object.entries(c.monthly).map(([month, m]) => ({
      chassis_number:  c.chassis_number,
      month,
      loads:           m.loads,
      active_days:     m.active_days,
      revenue:         m.revenue,
      carrier_cost:    m.carrier_cost,
      miles:           m.miles,
      utilization_pct: m.utilization_pct,
      margin:          m.margin,
      margin_pct:      m.margin_pct,
    }));
    const { error } = await supabase.from('monthly_stats').insert(rows);
    if (error) throw new Error(`monthly_stats insert failed for ${c.chassis_number}: ` + error.message);
    total += rows.length;
  }
  console.log(`  ✓ ${total} monthly stat rows inserted`);
}

async function seedMREvents(chassisData) {
  console.log('\nSeeding mr_events...');
  let total = 0;
  for (const [, c] of Object.entries(chassisData)) {
    if (!c.mr_events || c.mr_events.length === 0) continue;
    const rows = c.mr_events.map(e => ({
      chassis_number: c.chassis_number,
      event_date:     e.date,
      end_date:       e.end,
      event_type:     e.type,
      description:    e.desc,
      cost:           e.cost,
      vendor:         e.vendor,
    }));
    const { error } = await supabase.from('mr_events').insert(rows);
    if (error) throw new Error(`mr_events insert failed for ${c.chassis_number}: ` + error.message);
    total += rows.length;
  }
  console.log(`  ✓ ${total} M&R event rows inserted`);
}

async function seedIdleGaps(chassisData) {
  console.log('\nSeeding idle_gaps...');
  let total = 0;
  for (const [, c] of Object.entries(chassisData)) {
    if (!c.idle_gaps || c.idle_gaps.length === 0) continue;
    const rows = c.idle_gaps.map(g => ({
      chassis_number: c.chassis_number,
      gap_start:      g.start,
      gap_end:        g.end,
      days:           g.days,
      gap_type:       g.type,
    }));
    const { error } = await supabase.from('idle_gaps').insert(rows);
    if (error) throw new Error(`idle_gaps insert failed for ${c.chassis_number}: ` + error.message);
    total += rows.length;
  }
  console.log(`  ✓ ${total} idle gap rows inserted`);
}

async function verifyRowCounts() {
  console.log('\nVerifying row counts...');
  const tables = ['chassis','loads','monthly_stats','mr_events','idle_gaps'];
  const expected = { chassis: 7, loads: 581, monthly_stats: 107, mr_events: 16, idle_gaps: 175 };
  let allOk = true;
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) { console.error(`  ✗ ${table}: ${error.message}`); allOk = false; continue; }
    const ok = count === expected[table];
    console.log(`  ${ok ? '✓' : '⚠'} ${table}: ${count} rows${ok ? '' : ` (expected ${expected[table]})`}`);
    if (!ok) allOk = false;
  }
  return allOk;
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' Chassis Demo — Supabase Seed Script');
  console.log('═══════════════════════════════════════════');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Chassis: ${Object.keys(data.chassis).length}`);
  console.log(`Loads:   ${Object.values(data.chassis).reduce((a,c) => a + c.loads.length, 0)}`);
  console.log('');

  try {
    await clearTables();
    await seedChassis(data.chassis);
    await seedLoads(data.chassis);
    await seedMonthlyStats(data.chassis);
    await seedMREvents(data.chassis);
    await seedIdleGaps(data.chassis);
    const ok = await verifyRowCounts();
    console.log('\n' + (ok ? '✅ Seed complete — all counts match!' : '⚠️  Seed complete with warnings — check counts above'));
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

main();
