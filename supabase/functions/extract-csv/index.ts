// File: supabase/functions/extract-csv/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parse } from 'https://esm.sh/papaparse@5'; // CSV parser

// Create a Supabase admin client to safely insert data
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    // 1. Get the file path from the webhook payload
    const payload = await req.json();
    const filePath = payload.record.name; // e.g., "mg/mg_tms_2p5k_part_02.csv"

    // Ignore non-CSV files or files not in the 'mg' folder
    if (!filePath || !filePath.startsWith('mg/') || !filePath.endsWith('.csv')) {
      return new Response(JSON.stringify({ message: "Not a target CSV, skipping." }), { status: 200 });
    }

    // 2. Get the public URL for the new file
    const { data: urlData, error: urlError } = supabaseAdmin
      .storage
      .from('tms') // <-- Your bucket name
      .getPublicUrl(filePath);

    if (urlError) throw urlError;

    // 3. Fetch the CSV file content
    const csvResponse = await fetch(urlData.publicUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.statusText}`);
    }
    const csvText = await csvResponse.text();

    // 4. Parse the CSV data
    //    'header: true' assumes the first row in your CSV contains headers.
    const { data: parsedData, errors: parseErrors } = parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseErrors.length > 0) {
      console.error("Parsing errors:", parseErrors);
      throw new Error("Failed to parse CSV data.");
    }

    // 5. Format data for insertion
    //    !!! === CUSTOMIZE THIS SECTION === !!!
    //    This code maps your CSV headers to your database table columns.
    const dataToInsert = parsedData.map((row: any) => ({
      // DB_COLUMN_NAME: row.CSV_HEADER_NAME
      column_one: row.csv_header_for_column_one,
      column_two: row.csv_header_for_column_two,
      column_three: row.csv_header_for_column_three,
      // Add all other mappings here...

      source_file: filePath, // Tracks the source file
    }));

    if (dataToInsert.length === 0) {
      return new Response(JSON.stringify({ message: "CSV was empty, nothing to insert." }), { status: 200 });
    }

    // 6. Insert the data into your table
    //    !!! === CUSTOMIZE THIS SECTION === !!!
    const { error: insertError } = await supabaseAdmin
      .from('mg_tms_data') // <-- Change this to your table name from Step 1
      .insert(dataToInsert);

    if (insertError) throw insertError;

    // 7. Return a success response
    return new Response(JSON.stringify({ message: `Successfully inserted ${dataToInsert.length} rows.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing CSV:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
