
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Create the media-uploads bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const bucketName = 'media-uploads';
    if (!buckets.find(bucket => bucket.name === bucketName)) {
      const { error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        });

      if (error) {
        throw error;
      }

      // Set up public access policy for the bucket
      const { error: policyError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl('dummy.txt', 60);

      if (policyError && !policyError.message.includes('not found')) {
        console.error("Error setting up policy:", policyError);
      }
    }

    return new Response(JSON.stringify({
      message: "Storage bucket configured successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-storage-bucket function:', error);
    return new Response(JSON.stringify({
      error: error.message || "An unexpected error occurred"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
