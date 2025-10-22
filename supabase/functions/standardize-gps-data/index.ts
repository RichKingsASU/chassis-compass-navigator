import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GpsRecord {
  id: string;
  latitude: number;
  longitude: number;
  provider: string;
}

async function geocodeCoordinates(lat: number, lon: number, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components,
        location_type: result.geometry?.location_type
      };
    }
    
  return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { upload_id } = await req.json();
    
    if (!upload_id) {
      return new Response(
        JSON.stringify({ error: 'upload_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch GPS records for this upload
    const { data: gpsRecords, error: fetchError } = await supabase
      .from('gps_data')
      .select('id, latitude, longitude, provider')
      .eq('upload_id', upload_id)
      .is('raw_data->geocoded_address', null);

    if (fetchError) {
      throw fetchError;
    }

    if (!gpsRecords || gpsRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No records to standardize',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let errors = 0;

    // Process records in batches to avoid rate limits
    for (const record of gpsRecords) {
      try {
        const geocodeResult = await geocodeCoordinates(
          record.latitude,
          record.longitude,
          apiKey
        );

        if (geocodeResult) {
          // Update the record with geocoded data
          const { error: updateError } = await supabase
            .from('gps_data')
            .update({
              raw_data: {
                ...record.raw_data || {},
                geocoded_address: geocodeResult.formatted_address,
                place_id: geocodeResult.place_id,
                location_type: geocodeResult.location_type,
                geocoded_at: new Date().toISOString()
              }
            })
            .eq('id', record.id);

          if (updateError) {
            console.error('Update error for record', record.id, updateError);
            errors++;
          } else {
            processed++;
          }
        }

        // Add delay to respect rate limits (50 requests per second for free tier)
        await new Promise(resolve => setTimeout(resolve, 25));
        
      } catch (error) {
        console.error('Error processing record', record.id, error);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'GPS data standardization complete',
        total_records: gpsRecords.length,
        processed,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
