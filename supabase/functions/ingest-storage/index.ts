//supabase/functions/ingest-storage/index.ts
// Triggers on Storage "Object Created". Parses CSV/XLSX and writes rows to staging_file_rows.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as path from 'https://deno.land/std@0.224.0/path/mod.ts';

// CSV
import { parse } from 'https://deno.land/std@0.224.0/csv/mod.ts';

// Excel (SheetJS – works in Deno via esm.sh)
import XLSX from 'https://esm.sh/xlsx@0.18.5?target=es2022';

type ObjRecord = {
  bucket_id: string;
  name: string;          // object key
  metadata?: { eTag?: string } | null;
};

type StorageEvent =
  | { type: 'INSERT' | 'UPDATE'; table?: string; record: ObjRecord }                 // typical payload
  | { type?: string; record?: ObjRecord; payload?: { record: ObjRecord } };          // defensive

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const event = (await req.json()) as StorageEvent;
    // Find the object payload regardless of shape
    const rec: ObjRecord | undefined =
      (event as any).record ??
      (event as any).payload?.record;

    if (!rec?.bucket_id || !rec?.name) {
      return new Response(JSON.stringify({ ok: false, reason: 'No storage record in payload', event }), { status: 400 });
    }

    const bucket = rec.bucket_id;
    const key = rec.name;
    const ext = path.extname(key).toLowerCase();
    const etag = rec.metadata?.eTag ?? null;

    // Skip folders and hidden temp files
    if (key.endsWith('/') || key.startsWith('.') || key.includes('/.')) {
      return new Response(JSON.stringify({ ok: true, skipped: 'virtual folder or hidden file', bucket, key }), { status: 200 });
    }

    // Idempotency: skip if already processed (same object path). We ignore etag changes by default.
    const already = await supabase
      .from('ingest_files')
      .select('bucket_id,object_name')
      .eq('bucket_id', bucket)
      .eq('object_name', key)
      .maybeSingle();

    if (already.data) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already processed', bucket, key }), { status: 200 });
    }

    // Download the object
    const { data: fileBlob, error: dlErr } = await supabase.storage.from(bucket).download(key);
    if (dlErr) throw dlErr;

    const arrBuf = await fileBlob.arrayBuffer();

    // Parse to array of row objects
    let rows: Record<string, unknown>[] = [];

    if (ext === '.csv' || ext === '.tsv' || ext === '.txt') {
      const text = new TextDecoder().decode(new Uint8Array(arrBuf));
      // Auto-detect delimiter: default comma; use tab if obvious
      const delimiter = ext === '.tsv' ? '\t' : (text.includes('\t') && !text.includes(',')) ? '\t' : ',';
      rows = parse(text, { skipFirstRow: false, separator: delimiter, columns: true }) as Record<string, unknown>[];
    } else if (ext === '.xlsx' || ext === '.xls') {
      const wb = XLSX.read(arrBuf, { type: 'array' });
      const firstSheet = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheet];
      rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null }); // rows as objects
    } else {
      return new Response(JSON.stringify({ ok: true, skipped: 'unsupported extension', ext, bucket, key }), { status: 200 });
    }

    // Batch insert to staging_file_rows
    const batchSize = 500;
    let rowNum = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize).map((r) => ({
        bucket_id: bucket,
        object_name: key,
        row_number: ++rowNum,
        data: r,
      }));

      const { error: insErr } = await supabase.from('staging_file_rows').insert(chunk);
      if (insErr) throw insErr;
    }

    // Mark processed
    const { error: markErr } = await supabase.from('ingest_files').insert({
      bucket_id: bucket,
      object_name: key,
      etag,
    });
    if (markErr) throw markErr;

    return new Response(JSON.stringify({
      ok: true,
      bucket,
      key,
      rows_inserted: rows.length,
      ext
    }), { status: 200 });
  } catch (e) {
    console.error('ingest-storage error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
