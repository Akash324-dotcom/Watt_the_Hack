import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { actionType, frames, videoPath } = await req.json();
    
    if (!actionType || !frames || frames.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying video action for user ${user.id}: ${actionType}`);
    console.log(`Analyzing ${frames.length} frames`);

    // Use Lovable AI to verify the action based on video frames
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI verification system for a climate action community platform. Your job is to analyze screen recording frames and verify if the user's actions match what they claimed to do.

Action types available:
- recycle: Recycling waste (person putting items in recycling bins, sorting materials)
- plant: Planting trees or vegetation (person digging, planting, gardening)
- bike: Using bicycle for transportation (person on a bicycle, riding)
- public_transport: Using public transportation (person at bus stop, on train/bus)
- reduce_waste: Reducing waste generation (person using reusable items, composting)
- save_energy: Conserving energy (person turning OFF lights/appliances, NOT turning them ON)
  CRITICAL FOR SAVE_ENERGY: Compare the brightness levels across frames from start to end.
  - If frames show INCREASING brightness (room getting lighter), this indicates lights being turned ON → REJECT (verified: false)
  - If frames show DECREASING brightness (room getting darker), this indicates lights being turned OFF → VERIFY (verified: true)
  - In your feedback, explicitly mention whether brightness increased or decreased across the frames
- volunteer: Volunteering for environmental causes (person at volunteer events, cleanup activities)

You will receive multiple frames from a video recording showing a PERSON performing an action. The camera captured the person doing something in the real world. Analyze what the person is actually doing in the video.

Your response should assess:
1. Does the video show the person actually performing the claimed action in real life?
2. How confident are you in the match (0-100)?
3. Brief feedback explaining what you observed the person doing
4. Points recommendation based on the action's environmental impact and authenticity

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "verified": true/false,
  "confidence": number (0-100),
  "feedback": "Brief explanation of what was observed in the frames",
  "pointsRecommendation": number (1-10 based on impact)
}`;

    const userPrompt = `Claimed action: "${actionType}"

I'm providing ${frames.length} frames from a video recording. Analyze these frames and verify if they show the person actually performing the claimed action in real life. Look for evidence of the person doing the activity, not just UI screens or apps.`;

    // Prepare messages with image frames
    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: userPrompt },
          ...frames.map((frame: string) => ({
            type: 'image_url',
            image_url: { url: frame }
          }))
        ]
      }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service unavailable. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI verification failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', aiContent);

    // Parse AI response
    let verificationResult;
    try {
      const cleanContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      verificationResult = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Calculate points
    const pointsAwarded = verificationResult.verified 
      ? verificationResult.pointsRecommendation || 5
      : 0;

    // Store verification in database
    const { data: verification, error: insertError } = await supabase
      .from('action_verifications')
      .insert({
        user_id: user.id,
        action_type: actionType,
        user_description: `Video recording analysis - ${frames.length} frames`,
        verification_status: verificationResult.verified ? 'verified' : 'rejected',
        ai_confidence: verificationResult.confidence,
        ai_feedback: verificationResult.feedback,
        suggested_action: null,
        points_awarded: pointsAwarded,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to save verification');
    }

    // If verified, also log to user_actions table
    if (verificationResult.verified && pointsAwarded > 0) {
      const date = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      await supabase.from('user_actions').insert({
        user_id: user.id,
        action_type: actionType,
        points: pointsAwarded,
        date: date.toISOString().split('T')[0],
        day: days[date.getDay()],
      });
    }

    console.log('Video verification complete:', verification);

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          id: verification.id,
          verified: verificationResult.verified,
          confidence: verificationResult.confidence,
          feedback: verificationResult.feedback,
          pointsAwarded,
          status: verification.verification_status,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Video verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});