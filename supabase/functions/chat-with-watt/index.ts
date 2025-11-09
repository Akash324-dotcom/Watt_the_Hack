import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Detect emotional keywords in user messages
const detectEmotion = (text: string): string => {
  const emotions: Record<string, string[]> = {
    sad: ['sad', 'depressed', 'down', 'upset', 'unhappy', 'miserable'],
    anxious: ['anxious', 'worried', 'stressed', 'overwhelmed', 'nervous', 'scared'],
    tired: ['tired', 'exhausted', 'burned out', 'drained', 'fatigued'],
    happy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic'],
    hopeless: ['hopeless', 'helpless', 'pointless', 'useless', 'give up']
  };

  const lowerText = text.toLowerCase();
  
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return emotion;
    }
  }
  
  return 'neutral';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    // Get the last user message for emotion detection
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const detectedEmotion = lastUserMessage ? detectEmotion(lastUserMessage.content) : 'neutral';
    
    console.log('Detected emotion:', detectedEmotion);

    // Craft empathetic system prompt based on emotion
    const emotionContext: Record<string, string> = {
      sad: "The user seems sad or down. Respond with warmth, comfort, and gentle encouragement. Acknowledge their feelings genuinely.",
      anxious: "The user seems anxious or worried. Respond calmly and supportively. Help them feel grounded and offer reassuring, practical advice.",
      tired: "The user seems tired or burned out. Respond with compassion and understanding. Suggest gentle, achievable steps and remind them rest is important.",
      happy: "The user seems happy and positive! Match their energy with enthusiasm and celebrate their mood.",
      hopeless: "The user seems to feel hopeless or helpless. Respond with deep empathy and hope. Remind them that small actions matter and you're here to support them.",
      neutral: ""
    };

    const basePrompt = `You are "Watt the Hack" – a bright, energetic, and compassionate AI companion helping users with sustainability and personal well-being.

- Speak warmly and naturally, like a human friend.
- Be empathetic and uplifting.
- Share knowledgeable, fact-based insights about climate, energy, and eco-innovation.
- If the user expresses emotions or personal struggles, comfort them genuinely.
- Use occasional electric/energy puns naturally (like "spark", "charge", "power") but don't overdo it.
- Keep responses concise (2-4 sentences usually), kind, and thoughtful.
- Remember: Every action counts. You're here to inspire hope and practical action. 💚⚡`;

    const systemPrompt = emotionContext[detectedEmotion]
      ? `${basePrompt}\n\nIMPORTANT: ${emotionContext[detectedEmotion]}`
      : basePrompt;

    console.log('Calling Lovable AI with model: google/gemini-2.5-flash');

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted. Please add credits to continue.');
      }
      
      throw new Error('AI service error');
    }

    const data = await response.json();
    console.log('Lovable AI response received successfully');

    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content,
        emotion: detectedEmotion 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in chat-with-watt function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
