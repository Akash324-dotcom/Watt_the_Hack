import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - required for browser requests from different origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Text-to-Speech Edge Function
 * Converts text to speech using OpenAI's TTS API
 * Returns base64-encoded MP3 audio
 */
serve(async (req) => {
  // Handle CORS preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // ===== STEP 1: Parse and Validate Request Body =====
    let text: string;
    let voice: string | undefined;
    
    try {
      const body = await req.json();
      text = body.text;
      voice = body.voice;
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'Request body must be valid JSON with a "text" field',
          code: 'INVALID_REQUEST_BODY'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate text field
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          message: 'Text is required and must be a non-empty string',
          code: 'MISSING_TEXT'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate text length (OpenAI TTS has a 4096 character limit)
    if (text.length > 4096) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          message: 'Text exceeds maximum length of 4096 characters',
          code: 'TEXT_TOO_LONG',
          textLength: text.length,
          maxLength: 4096
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ===== STEP 2: Check API Key =====
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error',
          message: 'Text-to-speech service is not configured. Please contact support.',
          code: 'MISSING_API_KEY'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ===== STEP 3: Prepare Voice Selection =====
    // Available OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = voice && validVoices.includes(voice) ? voice : 'nova';
    
    console.log(`[TTS] Generating speech: voice=${selectedVoice}, textLength=${text.length}`);

    // ===== STEP 4: Call OpenAI TTS API =====
    const openaiResponse = await fetch(
      'https://api.openai.com/v1/audio/speech',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1', // Use 'tts-1-hd' for higher quality
          input: text,
          voice: selectedVoice,
          response_format: 'mp3',
        }),
      }
    );

    // ===== STEP 5: Handle OpenAI API Errors =====
    if (!openaiResponse.ok) {
      let errorDetails = {
        status: openaiResponse.status,
        message: 'Unknown error from OpenAI API',
        code: 'OPENAI_API_ERROR'
      };
      
      try {
        const errorData = await openaiResponse.json();
        errorDetails.message = errorData.error?.message || 'OpenAI API request failed';
        
        // Log the full error for debugging
        console.error('[TTS] OpenAI API error:', JSON.stringify(errorData, null, 2));
        
        // Provide user-friendly error messages based on status code
        if (openaiResponse.status === 401) {
          errorDetails.message = 'Invalid OpenAI API key. Please check your configuration.';
          errorDetails.code = 'INVALID_API_KEY';
        } else if (openaiResponse.status === 429) {
          errorDetails.message = 'OpenAI API quota exceeded. Please check your billing and usage limits.';
          errorDetails.code = 'QUOTA_EXCEEDED';
        } else if (openaiResponse.status === 400) {
          errorDetails.message = errorData.error?.message || 'Invalid request to OpenAI API';
          errorDetails.code = 'BAD_REQUEST';
        }
      } catch (parseError) {
        // If error response is not JSON, try to get text
        try {
          const errorText = await openaiResponse.text();
          errorDetails.message = errorText || 'Failed to parse OpenAI error response';
          console.error('[TTS] OpenAI API error (text):', errorText);
        } catch {
          console.error('[TTS] Could not parse OpenAI error response');
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Speech generation failed',
          message: errorDetails.message,
          code: errorDetails.code,
          status: errorDetails.status
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ===== STEP 6: Convert Audio to Base64 =====
    console.log('[TTS] Converting audio to base64...');
    
    const audioBuffer = await openaiResponse.arrayBuffer();
    const audioArray = new Uint8Array(audioBuffer);
    
    // Use chunked processing to avoid "Maximum call stack size exceeded" error
    // This is critical for Edge environments with limited stack size
    let binary = '';
    const chunkSize = 32768; // 32KB chunks - safe for all Edge runtimes
    
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.subarray(i, Math.min(i + chunkSize, audioArray.length));
      // Convert chunk to binary string without spreading (more memory efficient)
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Convert binary string to base64
    const base64Audio = btoa(binary);
    
    const audioSizeKB = (audioArray.length / 1024).toFixed(2);
    const base64SizeKB = (base64Audio.length / 1024).toFixed(2);
    console.log(`[TTS] Success: ${audioSizeKB}KB audio → ${base64SizeKB}KB base64`);

    // ===== STEP 7: Return Success Response =====
    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voice: selectedVoice,
        format: 'mp3',
        textLength: text.length,
        audioSizeBytes: audioArray.length
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Prevent caching of audio
        },
      }
    );
    
  } catch (error) {
    // ===== STEP 8: Catch-All Error Handler =====
    console.error('[TTS] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    // Log stack trace for debugging
    if (error instanceof Error && error.stack) {
      console.error('[TTS] Stack trace:', error.stack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: errorMessage,
        code: 'INTERNAL_ERROR',
        errorType: errorName
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
