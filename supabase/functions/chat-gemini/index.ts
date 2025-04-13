
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      SUPABASE_URL || '',
      SUPABASE_ANON_KEY || ''
    );

    const { messages, mediaUrls = [] } = await req.json();
    
    // Format content for Gemini API
    const parts = [];
    
    // Add system prompt if it exists (the first message with role 'system')
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage) {
      parts.push({ text: systemMessage.content });
    }
    
    // Add user and assistant messages
    const conversationMessages = messages.filter(m => m.role !== 'system');
    for (const message of conversationMessages) {
      if (message.role === 'user' || message.role === 'assistant') {
        const part = { text: message.content };
        parts.push(part);
      }
    }
    
    // Add any media contents
    for (const url of mediaUrls) {
      // For files stored in Supabase
      if (url.startsWith('data:')) {
        // Extract the base64 encoded image from the dataUrl
        const base64Data = url.split(',')[1];
        if (base64Data) {
          parts.push({
            inline_data: {
              data: base64Data,
              mime_type: url.split(';')[0].split(':')[1]
            }
          });
        }
      } else {
        try {
          // For external URLs
          const response = await fetch(url);
          const contentType = response.headers.get('content-type');
          const arrayBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          parts.push({
            inline_data: {
              data: base64,
              mime_type: contentType
            }
          });
        } catch (error) {
          console.error(`Failed to fetch media from ${url}:`, error);
        }
      }
    }

    // Make request to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    const data = await response.json();
    
    let assistantResponse = "";
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      assistantResponse = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.error("Gemini API error:", data.error);
      assistantResponse = "Sorry, I encountered an error processing your request.";
    } else {
      assistantResponse = "I'm not sure how to respond to that.";
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
      error: error.message || "An unexpected error occurred" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
