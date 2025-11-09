import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENWEATHER_API_KEY = "11d8802fadd2ac8363e00367d6f306c9";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("OpenWeatherMap API error:", response.status, error);
      throw new Error(`Weather API error: ${error}`);
    }

    const data = await response.json();
    console.log('Weather data fetched successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
