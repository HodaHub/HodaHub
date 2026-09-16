// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * HodaHub Supabase Edge Function: delete-cloudinary-image
 * Securely destroys Cloudinary media assets using server-side API credentials.
 * Brand: HodaHub
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha1Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { public_id, resource_type = 'image' } = body;

    // 1. Validate payload
    if (!public_id || typeof public_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid public_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Read exact environment variables
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('HodaHub Error: Missing Cloudinary secrets (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
      return new Response(
        JSON.stringify({
          error: 'Cloudinary server configuration missing. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in Supabase secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Generate Cloudinary signature
    // Unix timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // String to sign: public_id={public_id}&timestamp={timestamp}{API_SECRET}
    const signatureString = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1Hex(signatureString);

    // 4. Send request to Cloudinary destroy API
    const formData = new URLSearchParams();
    formData.append('public_id', public_id);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const targetUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resource_type}/destroy`;
    const cldResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const cldData = await cldResponse.json();
    const isSuccess = cldResponse.ok && (cldData.result === 'ok' || cldData.result === 'not found');

    if (!isSuccess) {
      return new Response(
        JSON.stringify({
          error: cldData.error?.message || cldData.result || 'Failed to destroy Cloudinary asset',
          details: cldData,
        }),
        { status: cldResponse.ok ? 400 : cldResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: cldData.result,
        public_id,
        brand: 'HodaHub',
        message: `Asset ${public_id} successfully deleted from Cloudinary`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('HodaHub delete-cloudinary-image exception:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error while destroying image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
