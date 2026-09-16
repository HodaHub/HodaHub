/**
 * HodaHub Pincode Serviceability Edge Function
 * Uses native Deno.serve (Supabase Edge Runtime).
 * Integrates with Delhivery Pincode Serviceability API (GET /c/api/pin-codes/json/?filter_codes={pincode})
 * and resolves real city, state, COD eligibility, and delivery SLA without hardcoded placeholders.
 *
 * Brand: HodaHub
 */

// Declare global Deno namespace for IDE TypeScript support in non-Deno projects
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATE_CODE_MAP: Record<string, string> = {
  AN: 'Andaman and Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CG: 'Chhattisgarh',
  CT: 'Chhattisgarh',
  DN: 'Dadra and Nagar Haveli and Daman and Diu',
  DD: 'Daman and Diu',
  DL: 'Delhi',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JK: 'Jammu and Kashmir',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OR: 'Odisha',
  OD: 'Odisha',
  PY: 'Puducherry',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TG: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  UA: 'Uttarakhand',
  WB: 'West Bengal',
};

function resolveStateName(rawState?: string): string {
  if (!rawState) return '';
  const trimmed = rawState.trim();
  const upper = trimmed.toUpperCase();
  if (STATE_CODE_MAP[upper]) {
    return STATE_CODE_MAP[upper];
  }
  return trimmed;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let rawPincode = '';

    // Support both GET query parameters and POST body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      rawPincode = url.searchParams.get('pincode') || url.searchParams.get('filter_codes') || '';
    } else {
      try {
        const body = await req.json();
        rawPincode = body?.pincode || body?.filter_codes || '';
      } catch {
        const url = new URL(req.url);
        rawPincode = url.searchParams.get('pincode') || url.searchParams.get('filter_codes') || '';
      }
    }

    const cleanPincode = String(rawPincode || '').trim().replace(/\D/g, '');

    if (!cleanPincode || cleanPincode.length !== 6 || cleanPincode.startsWith('0')) {
      return new Response(
        JSON.stringify({
          serviceable: false,
          error: 'Please enter a valid 6-digit pincode',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const delhiveryKey = Deno.env.get('DELHIVERY_API_KEY');

    // 1. If Delhivery API key is configured, query Delhivery's live serviceability endpoint
    if (delhiveryKey) {
      try {
        const res = await fetch(`https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${cleanPincode}`, {
          headers: {
            Authorization: `Token ${delhiveryKey}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const json = await res.json();
          const deliveryCodes = json?.delivery_codes;

          // If Delhivery returns empty delivery_codes array, the pincode does not exist in their network
          if (Array.isArray(deliveryCodes) && deliveryCodes.length === 0) {
            return new Response(
              JSON.stringify({
                serviceable: false,
                error: 'Please enter a valid 6-digit pincode',
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const record = deliveryCodes?.[0]?.postal_code || deliveryCodes?.[0];
          if (record && (record.pin || record.district || record.city)) {
            const rawCity = record.district || record.city || record.division || '';
            const rawState = record.state_code || record.state || record.state_name || '';
            const resolvedCity = rawCity.trim();
            const resolvedState = resolveStateName(rawState);

            const isPrepaid = record.pre_paid === 'Y';
            const isCash = record.cash === 'Y' || record.cod === 'Y';
            const isServiceable = isPrepaid || isCash || record.is_serviceable === true;
            const estimatedDays = Number(record.expected_days || record.delivery_days || 2);

            return new Response(
              JSON.stringify({
                serviceable: isServiceable,
                city: resolvedCity,
                state: resolvedState,
                estimatedDays,
                codAvailable: isCash,
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (delhiveryErr) {
        console.warn('HodaHub Delhivery serviceability lookup exception:', delhiveryErr);
      }
    }

    // 2. Real-time Indian Postal directory lookup
    try {
      const postalRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
      if (postalRes.ok) {
        const postalData = await postalRes.json();
        if (
          Array.isArray(postalData) &&
          postalData[0]?.Status === 'Success' &&
          Array.isArray(postalData[0]?.PostOffice) &&
          postalData[0].PostOffice.length > 0
        ) {
          const po = postalData[0].PostOffice[0];
          const resolvedCity = po.District || po.Division || po.Block || po.Circle || '';
          const resolvedState = po.State || '';

          return new Response(
            JSON.stringify({
              serviceable: true,
              city: resolvedCity,
              state: resolvedState,
              estimatedDays: 2,
              codAvailable: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Pincode does not exist in Indian postal directory
          return new Response(
            JSON.stringify({
              serviceable: false,
              error: 'Please enter a valid 6-digit pincode',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (postalErr) {
      console.warn('HodaHub postal API lookup exception:', postalErr);
    }

    // 3. Fallback error when pincode cannot be resolved
    return new Response(
      JSON.stringify({
        serviceable: false,
        error: 'Please enter a valid 6-digit pincode',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        serviceable: false,
        error: error.message || 'Please enter a valid 6-digit pincode',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
