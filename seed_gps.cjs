/**
 * seed_gps.cjs
 * Reads gps_demo_data.json and seeds into Supabase.
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (SUPABASE_URL.includes('YOUR_PROJECT') || SUPABASE_KEY.includes('YOUR_SERVICE_ROLE_KEY')) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables before running.');
  console.error('  Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node seed_gps.cjs');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function supabaseRequest(method, table, query, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table} failed (${res.status}): ${text}`);
  }
  return res;
}

async function main() {
  console.log('Reading gps_demo_data.json...');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'gps_demo_data.json'), 'utf8'));
  const { upload, gps_rows } = data;

  console.log(`Upload ID: ${upload.id}`);
  console.log(`Total GPS rows: ${gps_rows.length}`);

  // 1. Delete existing gps_data for this upload
  console.log('\n1. Deleting existing gps_data rows...');
  await supabaseRequest('DELETE', 'gps_data', `upload_id=eq.${upload.id}`);
  console.log('   Done.');

  // 2. Delete existing upload record
  console.log('2. Deleting existing upload record...');
  await supabaseRequest('DELETE', 'gps_uploads', `id=eq.${upload.id}`);
  console.log('   Done.');

  // 3. Insert upload record
  console.log('3. Inserting upload record...');
  await supabaseRequest('POST', 'gps_uploads', null, upload);
  console.log('   Done.');

  // 4. Insert gps_data in batches of 500
  console.log('4. Inserting GPS data in batches of 500...');
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < gps_rows.length; i += BATCH_SIZE) {
    const batch = gps_rows.slice(i, i + BATCH_SIZE);
    await supabaseRequest('POST', 'gps_data', null, batch);
    inserted += batch.length;
    const pct = ((inserted / gps_rows.length) * 100).toFixed(1);
    process.stdout.write(`   Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(gps_rows.length / BATCH_SIZE)} — ${inserted}/${gps_rows.length} (${pct}%)\r`);
  }
  console.log(`\n   Inserted ${inserted} GPS rows.`);

  // 5. Verify counts
  console.log('5. Verifying...');
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/gps_data?upload_id=eq.${upload.id}&select=id`,
    { method: 'HEAD', headers: { ...headers, Prefer: 'count=exact' } }
  );
  const contentRange = countRes.headers.get('content-range');
  const dbCount = contentRange ? contentRange.split('/')[1] : 'unknown';
  console.log(`   DB row count: ${dbCount}`);
  console.log(`   Expected:     ${gps_rows.length}`);

  console.log('\n✅ GPS seed complete!');
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
