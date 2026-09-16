import { supabase } from '../lib/supabase';

/**
 * HodaHub Frontend Delivery Service
 * Manages pincode serviceability, city & state validation, and delivery timelines.
 * Integrates with Delhivery Pincode Serviceability API via the 'check-pincode-serviceability' Edge Function.
 *
 * Brand: HodaHub
 */

export interface DeliveryServiceabilityResult {
  serviceable: boolean;
  city?: string;
  state?: string;
  estimatedDays?: number;
  codAvailable?: boolean;
  error?: string;
}

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

/**
 * Checks pincode serviceability and resolves the real city and state.
 * Never returns hardcoded/placeholder fallback text.
 *
 * @param pincode 6-digit Indian postal code
 * @returns DeliveryServiceabilityResult { serviceable, city, state, estimatedDays, codAvailable, error? }
 */
export async function checkServiceability(pincode: string): Promise<DeliveryServiceabilityResult> {
  const cleanPincode = String(pincode || '').trim().replace(/\D/g, '');

  if (!cleanPincode || cleanPincode.length !== 6 || cleanPincode.startsWith('0')) {
    return {
      serviceable: false,
      error: 'Please enter a valid 6-digit pincode',
    };
  }

  // 1. Invoke Supabase Edge Function 'check-pincode-serviceability'
  try {
    const { data, error } = await supabase.functions.invoke('check-pincode-serviceability', {
      body: { pincode: cleanPincode },
    });

    if (!error && data) {
      if (data.serviceable && data.city && data.state) {
        return {
          serviceable: true,
          city: data.city,
          state: resolveStateName(data.state),
          estimatedDays: Number(data.estimatedDays || 2),
          codAvailable: data.codAvailable ?? true,
        };
      }

      if (data.error || data.serviceable === false) {
        return {
          serviceable: false,
          error: data.error || 'Please enter a valid 6-digit pincode',
        };
      }
    }
  } catch (err) {
    console.warn('HodaHub deliveryService: Edge function invocation note:', err);
  }

  // 2. Direct India Postal Directory fallback if Edge Function is unavailable/not deployed
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === 'Success' &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Division || po.Block || po.Circle || '';
        const state = resolveStateName(po.State || '');

        if (city && state) {
          return {
            serviceable: true,
            city,
            state,
            estimatedDays: 2,
            codAvailable: true,
          };
        }
      } else {
        // Pincode does not exist in postal database
        return {
          serviceable: false,
          error: 'Please enter a valid 6-digit pincode',
        };
      }
    }
  } catch (apiErr) {
    console.warn('HodaHub deliveryService: Postal lookup note:', apiErr);
  }

  // 3. Fallback error when pincode cannot be validated
  return {
    serviceable: false,
    error: 'Please enter a valid 6-digit pincode',
  };
}

export default {
  checkServiceability,
};
