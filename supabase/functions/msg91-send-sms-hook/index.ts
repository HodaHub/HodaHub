import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

/**
 * HodaHub - Supabase Auth Send SMS Hook (MSG91)
 *
 * Replaces default built-in phone provider with MSG91 via Supabase Hooks.
 * Supabase Auth calls this webhook with an internally generated OTP.
 * Webhook signatures are verified using Standard Webhooks (HMAC-SHA256).
 *
 * Brand: HodaHub
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature, svix-id, svix-timestamp, svix-signature',
};

// Fallback manual HMAC-SHA256 signature verification in case standardwebhooks fails
async function verifyStandardWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  try {
    // 1. First attempt with StandardWebhooks library
    const wh = new Webhook(secret);
    const headerObj: Record<string, string> = {};
    for (const [k, v] of headers.entries()) {
      headerObj[k] = v;
    }
    wh.verify(rawBody, headerObj);
    return true;
  } catch (libErr) {
    // 2. Fallback to Web Crypto subtle HMAC-SHA256
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

      // Extract raw secret bytes (decode base64 if prefixed with whsec_)
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

      // Signatures header may contain multiple space-delimited signatures (e.g. "v1,abc v1,xyz")
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
    // 1. Read raw body text for strict signature verification
    const rawBody = await req.text();

    // 2. Verify signature using SMS_HOOK_SECRET
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
    } else {
      console.warn('HodaHub SMS Hook: SMS_HOOK_SECRET not configured. Please set secret for production security.');
    }

    // 3. Parse JSON payload from Supabase Auth
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
    // Schema: { user: { phone: "+919876543210", ... }, sms: { otp: "123456" } }
    const recipientPhone = payload.user?.phone || payload.phone || payload.recipient;
    const otpCode = payload.sms?.otp || payload.otp;

    if (!recipientPhone || !otpCode) {
      console.error('HodaHub SMS Hook: Missing phone or OTP code in payload:', payload);
      return new Response(
        JSON.stringify({ error: { message: 'Missing recipient phone or OTP code in payload' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for MSG91 (India format requires 91 prefix without leading +)
    const cleanDigits = recipientPhone.replace(/\D/g, '');
    const mobile = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

    // 4. Retrieve MSG91 configuration
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY');
    const msg91SenderId = Deno.env.get('MSG91_SENDER_ID') || 'HODAHB';
    const msg91TemplateId = Deno.env.get('MSG91_TEMPLATE_ID_OTP');

    if (!msg91AuthKey || !msg91TemplateId) {
      console.warn(
        `HodaHub SMS Hook: MSG91_AUTH_KEY or MSG91_TEMPLATE_ID_OTP is not set in secrets. Dev mock mode OTP: ${otpCode} for ${mobile}`
      );
      // Return success response so local development & sandbox tests proceed smoothly
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Dispatch OTP via MSG91 OTP API (v5)
    // Query params carry template_id, mobile, and custom otp code
    const otpEndpoint = new URL('https://control.msg91.com/api/v5/otp');
    otpEndpoint.searchParams.set('template_id', msg91TemplateId);
    otpEndpoint.searchParams.set('mobile', mobile);
    otpEndpoint.searchParams.set('authkey', msg91AuthKey);
    otpEndpoint.searchParams.set('otp', String(otpCode));

    const response = await fetch(otpEndpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: msg91AuthKey,
      },
      body: JSON.stringify({
        otp: String(otpCode),
        OTP: String(otpCode),
        sender: msg91SenderId,
        company: 'HodaHub',
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok || (responseData.type && responseData.type === 'error')) {
      console.error('MSG91 OTP API error response:', responseData);

      // Attempt fallback to MSG91 Flow API in case user registered as a Flow template
      try {
        const flowResponse = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            authkey: msg91AuthKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            template_id: msg91TemplateId,
            sender: msg91SenderId,
            short_url: '0',
            mobiles: mobile,
            otp: String(otpCode),
            OTP: String(otpCode),
          }),
        });

        const flowData = await flowResponse.json().catch(() => ({}));
        if (!flowResponse.ok || (flowData.type && flowData.type === 'error')) {
          console.error('MSG91 Flow API fallback error:', flowData);
          return new Response(
            JSON.stringify({
              error: {
                message: responseData.message || flowData.message || 'Failed to deliver OTP via MSG91',
              },
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (flowErr) {
        return new Response(
          JSON.stringify({
            error: { message: responseData.message || 'MSG91 gateway communication error' },
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`HodaHub: OTP dispatched via MSG91 to ${mobile.slice(-4).padStart(mobile.length, '*')}`);

    // 6. Supabase Send SMS Hook contract expects HTTP 200 with an empty JSON object on success
    return new Response(JSON.stringify({}), {
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
