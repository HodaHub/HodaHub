import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

/**
 * HodaHub - Supabase Auth Send SMS Hook (Fast2SMS)
 *
 * Replaces default built-in phone provider with Fast2SMS Quick OTP route.
 * Fast2SMS does NOT require DLT registration, Entity ID, or business certificates.
 *
 * Supabase Auth calls this webhook with an internally generated OTP.
 * Webhook signatures are verified using Standard Webhooks (HMAC-SHA256).
 *
 * Brand: HodaHub
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature, svix-id, svix-timestamp, svix-signature',
};

// Fallback manual HMAC-SHA256 signature verification in case standardwebhooks library fails
async function verifyStandardWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  try {
    const wh = new Webhook(secret);
    const headerObj: Record<string, string> = {};
    for (const [k, v] of headers.entries()) {
      headerObj[k] = v;
    }
    wh.verify(rawBody, headerObj);
    return true;
  } catch (_libErr) {
    try {
      const id = headers.get('webhook-id') || headers.get('svix-id');
      const timestamp = headers.get('webhook-timestamp') || headers.get('svix-timestamp');
      const signatureHeader = headers.get('webhook-signature') || headers.get('svix-signature');

      if (!id || !timestamp || !signatureHeader) {
        return false;
      }

      // Check timestamp drift (5 minutes / 300s tolerance)
      const nowSeconds = Math.floor(Date.now() / 1000);
      const headerSeconds = parseInt(timestamp, 10);
      if (isNaN(headerSeconds) || Math.abs(nowSeconds - headerSeconds) > 300) {
        console.warn('Webhook timestamp tolerance exceeded');
        return false;
      }

      const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
      let secretBytes: Uint8Array;
      try {
        const binStr = atob(cleanSecret);
        secretBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          secretBytes[i] = binStr.charCodeAt(i);
        }
      } catch {
        secretBytes = new TextEncoder().encode(secret);
      }

      const enc = new TextEncoder();
      const signedPayload = `${id}.${timestamp}.${rawBody}`;

      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const computedBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
      const computedBase64 = btoa(String.fromCharCode(...new Uint8Array(computedBuffer)));

      const passedSignatures = signatureHeader.split(' ');
      return passedSignatures.some((sig) => {
        const parts = sig.split(',');
        return parts.length === 2 && parts[0] === 'v1' && parts[1] === computedBase64;
      });
    } catch (manualErr) {
      console.error('Signature verification error:', manualErr);
      return false;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();

    // Verify signature if SMS_HOOK_SECRET is set
    const hookSecret = Deno.env.get('SMS_HOOK_SECRET') || Deno.env.get('SUPABASE_SMS_HOOK_SECRET');

    if (hookSecret) {
      const isValid = await verifyStandardWebhookSignature(rawBody, req.headers, hookSecret);
      if (!isValid) {
        console.error('HodaHub SMS Hook: Unauthorized request. Signature verification failed.');
        return new Response(
          JSON.stringify({ error: { message: 'Invalid or missing webhook signature' } }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Parse JSON payload
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: { message: 'Malformed JSON payload' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract phone and OTP from Supabase Send SMS Hook payload contract:
    // Schema: { user: { phone: "+919876543210" }, sms: { otp: "123456" } }
    // Or direct: { phone: "9876543210", otp: "123456" }
    const recipientPhone = payload.user?.phone || payload.phone || payload.recipient;
    const otpCode = payload.sms?.otp || payload.otp;

    if (!recipientPhone || !otpCode) {
      console.error('HodaHub SMS Hook: Missing phone or OTP code in payload:', payload);
      return new Response(
        JSON.stringify({ error: { message: 'Missing recipient phone or OTP code in payload' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fast2SMS requires exact 10-digit Indian mobile numbers (e.g. 9876543210)
    const cleanDigits = recipientPhone.replace(/\D/g, '');
    const mobile10Digits = cleanDigits.slice(-10);

    if (mobile10Digits.length !== 10) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid 10-digit Indian mobile number' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve Fast2SMS authorization key
    const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY') || Deno.env.get('VITE_FAST2SMS_API_KEY');

    if (!fast2smsKey) {
      console.warn(
        `HodaHub SMS Hook: FAST2SMS_API_KEY is not set in secrets. Dev mock mode OTP: ${otpCode} for ${mobile10Digits}`
      );
      // Return 200 so development works smoothly even before key is provided
      return new Response(JSON.stringify({ success: true, mock: true, otp: otpCode }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dispatch OTP via Fast2SMS Quick OTP route (No DLT certificate needed)
    const fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';
    const response = await fetch(fast2smsUrl, {
      method: 'POST',
      headers: {
        'authorization': fast2smsKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: String(otpCode),
        numbers: mobile10Digits,
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok || responseData.return === false) {
      console.error('Fast2SMS API error response:', responseData);
      return new Response(
        JSON.stringify({
          error: {
            message: responseData.message?.[0] || responseData.message || 'Failed to deliver OTP via Fast2SMS',
          },
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`HodaHub: OTP dispatched via Fast2SMS to ${mobile10Digits.slice(-4).padStart(10, '*')}`);

    // Supabase Send SMS Hook contract expects HTTP 200 with an empty JSON object on success
    return new Response(JSON.stringify({ success: true, requestId: responseData.request_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('HodaHub SMS Hook unhandled exception:', error);
    return new Response(
      JSON.stringify({ error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
