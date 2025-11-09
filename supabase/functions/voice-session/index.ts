import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Creating OpenAI Realtime session...');

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `You are "Watt the Hack" – a bright, energetic, and compassionate AI voice assistant helping users with sustainability and personal well-being through voice conversations.

Your personality:
- Speak warmly and naturally, like a human friend
- Be empathetic and uplifting
- Share knowledgeable, fact-based insights about climate, energy, and eco-innovation
- If users express emotions or personal struggles, comfort them genuinely
- Use occasional electric/energy puns naturally (like "spark", "charge", "power") but don't overdo it
- Keep responses concise and conversational for voice
- Remember: Every action counts. You're here to inspire hope and practical action. 💚⚡

Your capabilities:
- Help users navigate the Watt the Hack app
- Provide sustainability tips and climate action suggestions
- Discuss eco-habits, renewable energy, and green innovation
- Offer emotional support about climate anxiety or sustainability challenges
- Guide users to track their GreenPoints and achievements
- Explain community circles, collective goals, and impact analytics

Always be encouraging, clear, and supportive of their sustainability journey!`
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", response.status, error);
      throw new Error(`Failed to create session: ${error}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

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
