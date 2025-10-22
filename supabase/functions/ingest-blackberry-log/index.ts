import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngestRequest {
  bucket: string;
  path: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bucket, path }: IngestRequest = await req.json();
    
    if (!bucket || !path) {
      return new Response(
        JSON.stringify({ error: 'Missing bucket or path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Downloading file from ${bucket}/${path}`);

    // Download the CSV file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse CSV
    const text = await fileData.text();
    let lines = text.trim().split('\n');
    
    // Skip Excel metadata line if present (sep=)
    if (lines[0] && lines[0].toLowerCase().startsWith('sep=')) {
      lines = lines.slice(1);
    }
    
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'CSV file is empty or has no data rows' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('CSV Headers:', headers);

    // Find column indices for BlackBerry format
    const latIndex = headers.findIndex(h => /latitude|lat/i.test(h));
    const lonIndex = headers.findIndex(h => /longitude|lon|lng/i.test(h));
    const deviceIdIndex = headers.findIndex(h => /device.*id|asset.*id|unit.*id|trailer/i.test(h));
    const timestampIndex = headers.findIndex(h => /timestamp|date.*time|recorded/i.test(h));
    const speedIndex = headers.findIndex(h => /speed/i.test(h));
    const batteryIndex = headers.findIndex(h => /battery/i.test(h));

    console.log('Column indices:', { latIndex, lonIndex, deviceIdIndex, timestampIndex, speedIndex, batteryIndex });

    // Get upload_id from gps_uploads table
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('gps_uploads')
      .select('id')
      .eq('file_path', path)
      .single();

    if (uploadError) {
      console.error('Upload record not found:', uploadError);
      return new Response(
        JSON.stringify({ error: `Upload record not found: ${uploadError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upload_id = uploadRecord.id;

    // Parse data rows
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const lat = latIndex >= 0 ? parseFloat(values[latIndex]) : null;
      const lon = lonIndex >= 0 ? parseFloat(values[lonIndex]) : null;
      
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.log(`Skipping row ${i}: invalid coordinates`);
        continue;
      }

      const record: any = {
        upload_id,
        provider: 'BlackBerry Radar',
        latitude: lat,
        longitude: lon,
        recorded_at: new Date().toISOString(),
        raw_data: { original_row: values }
      };

      if (deviceIdIndex >= 0 && values[deviceIdIndex]) {
        record.device_id = values[deviceIdIndex];
      }

      if (timestampIndex >= 0 && values[timestampIndex]) {
        try {
          const ts = new Date(values[timestampIndex]);
          if (!isNaN(ts.getTime())) {
            record.recorded_at = ts.toISOString();
          }
        } catch (e) {
          console.log(`Invalid timestamp at row ${i}:`, values[timestampIndex]);
        }
      }

      if (speedIndex >= 0 && values[speedIndex]) {
        const speed = parseFloat(values[speedIndex]);
        if (!isNaN(speed)) record.speed = speed;
      }

      if (batteryIndex >= 0 && values[batteryIndex]) {
        const battery = parseInt(values[batteryIndex]);
        if (!isNaN(battery)) record.battery_level = battery;
      }

      records.push(record);
    }

    console.log(`Parsed ${records.length} valid GPS records`);

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ inserted: 0, warning: 'No valid GPS records found in CSV' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert in batches of 1000
    const batchSize = 1000;
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('gps_data')
        .insert(batch);

      if (insertError) {
        console.error(`Batch insert error at row ${i}:`, insertError);
        return new Response(
          JSON.stringify({ error: `Failed to insert GPS data: ${insertError.message}`, inserted: totalInserted }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      totalInserted += batch.length;
      console.log(`Inserted batch: ${totalInserted}/${records.length}`);
    }

    // Update upload record status
    await supabase
      .from('gps_uploads')
      .update({ status: 'processed', row_count: totalInserted })
      .eq('id', upload_id);

    return new Response(
      JSON.stringify({ inserted: totalInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
