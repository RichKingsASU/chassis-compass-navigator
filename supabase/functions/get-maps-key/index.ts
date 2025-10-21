import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!mapsApiKey) {
      return new Response(JSON.stringify({ error: 'Maps API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ apiKey: mapsApiKey }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
