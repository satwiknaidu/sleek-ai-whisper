
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
    // Use the service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Create the media-uploads bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'media-uploads');
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket('media-uploads', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain'],
      });
      
      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
      
      console.log('Created media-uploads bucket:', data);
      
      // Create RLS policy to allow uploads for all users
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'media-uploads',
        policy_name: 'allow_public_uploads',
        definition: 'true',
        operation: 'INSERT'
      });
      
      if (policyError) {
        console.error('Failed to create upload policy:', policyError);
      }
      
      // Create RLS policy to allow downloads for all users
      const { error: downloadPolicyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'media-uploads',
        policy_name: 'allow_public_downloads',
        definition: 'true',
        operation: 'SELECT'
      });
      
      if (downloadPolicyError) {
        console.error('Failed to create download policy:', downloadPolicyError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Storage bucket setup complete'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in create-storage-bucket function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to setup storage bucket'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
