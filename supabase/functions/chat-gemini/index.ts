
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // We'll use the service role key for storage access to bypass RLS
    const supabaseAdmin = createClient(
      SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const supabaseClient = createClient(
      SUPABASE_URL || '',
      SUPABASE_ANON_KEY || ''
    );

    const { messages, mediaUrls = [] } = await req.json();
    
    console.log("Processing request with messages:", JSON.stringify(messages));
    console.log("Media URLs:", JSON.stringify(mediaUrls));
    
    // Format content for Gemini API
    const contents = [];
    
    // Convert messages to Gemini format
    for (const message of messages) {
      if (message.role === 'user' || message.role === 'assistant') {
        contents.push({
          role: message.role,
          parts: [{ text: message.content }]
        });
      }
    }

    // Prepare the media if it exists
    let mediaContent = [];
    for (const url of mediaUrls) {
      try {
        if (url.startsWith('data:')) {
          // Handle data URLs
          const base64Data = url.split(',')[1];
          if (base64Data) {
            const mimeType = url.split(';')[0].split(':')[1];
            mediaContent.push({
              inline_data: {
                data: base64Data,
                mime_type: mimeType
              }
            });
          }
        } else {
          // For Supabase storage URLs, we need to get the actual file
          let response;
          
          if (url.includes('storage.googleapis.com') || url.includes('media-uploads')) {
            // This is likely a Supabase Storage URL, try to fetch it with admin privileges
            const path = url.split('/').pop();
            if (path) {
              const { data, error } = await supabaseAdmin.storage
                .from('media-uploads')
                .download(path);
                
              if (error) {
                console.error(`Error downloading from storage: ${error.message}`);
                throw error;
              }
              
              // Convert the file to a base64 string
              const arrayBuffer = await data.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
              
              mediaContent.push({
                inline_data: {
                  data: base64,
                  mime_type: data.type
                }
              });
              
              // Skip the regular fetch since we've already handled it
              continue;
            }
          }
          
          // Handle other direct URLs
          response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
          
          const contentType = response.headers.get('content-type');
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          mediaContent.push({
            inline_data: {
              data: base64,
              mime_type: contentType
            }
          });
        }
      } catch (error) {
        console.error(`Failed to process media from ${url}:`, error);
      }
    }

    // If media exists, add it to the last user message
    if (mediaContent.length > 0) {
      // Find the most recent user message
      const lastUserMessageIndex = [...contents].reverse().findIndex(c => c.role === 'user');
      if (lastUserMessageIndex !== -1) {
        const actualIndex = contents.length - 1 - lastUserMessageIndex;
        // Add media to this message's parts
        contents[actualIndex].parts = [
          { text: contents[actualIndex].parts[0].text },
          ...mediaContent
        ];
      } else {
        // If no user message found, create a new one with just the media
        contents.push({
          role: 'user',
          parts: mediaContent
        });
      }
    }

    console.log("Sending to Gemini API with contents:", JSON.stringify(contents));

    let assistantResponse = "";
    
    // Always use gemini-1.5-flash which supports both text and vision capabilities
    const modelToUse = "gemini-1.5-flash";
    console.log(`Using model: ${modelToUse}`);
    
    // Make request to Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent`;
    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });
    
    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data));
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      assistantResponse = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.error("Gemini API error:", data.error);
      throw new Error(data.error.message || "Gemini API error");
    } else {
      throw new Error("Unexpected response format from Gemini API");
    }

    return new Response(JSON.stringify({ 
      response: assistantResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in chat-gemini function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      response: "I'm having trouble processing your request right now. Please try again later."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
