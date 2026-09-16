// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * HodaHub Supabase Edge Function: replace-cloudinary-image
 * Uploads an image with overwrite: true reusing the specified public_id,
 * ensuring strict alphabetical signature string formatting.
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
    const { public_id, file } = body;

    // 1. Validate parameters
    if (!public_id || typeof public_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'public_id (string) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!file || typeof file !== 'string') {
      return new Response(
        JSON.stringify({ error: 'file (base64 data URI or string) is required' }),
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

    // 3. Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 4. Exact alphabetical signature string:
    // Parameters in alphabetical order: overwrite, public_id, timestamp
    // Formula: overwrite=true&public_id={public_id}&timestamp={timestamp}{API_SECRET}
    const signatureString = `overwrite=true&public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = await sha1Hex(signatureString);

    // 5. Build form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('public_id', public_id);
    formData.append('timestamp', timestamp);
    formData.append('overwrite', 'true');
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const targetUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const cldResponse = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    const cldData = await cldResponse.json();

    if (!cldResponse.ok || cldData.error) {
      return new Response(
        JSON.stringify({
          error: cldData.error?.message || 'Failed to replace image in Cloudinary',
          details: cldData,
        }),
        { status: cldResponse.ok ? 400 : cldResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        public_id: cldData.public_id || public_id,
        secure_url: cldData.secure_url,
        url: cldData.url,
        width: cldData.width,
        height: cldData.height,
        format: cldData.format,
        brand: 'HodaHub',
        message: `Asset ${public_id} successfully replaced in Cloudinary`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('HodaHub replace-cloudinary-image exception:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error while replacing image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
