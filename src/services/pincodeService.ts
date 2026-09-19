// Service for instant Indian PIN Code lookup to auto-fill City and State

const pincodeCache = new Map<string, { city: string; state: string }>();

export async function lookupPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  const clean = pincode.replace(/\D/g, '').trim();
  if (clean.length !== 6) return null;

  if (pincodeCache.has(clean)) {
    return pincodeCache.get(clean)!;
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
        const po = data[0].PostOffice[0];
        const city = po.District || po.Division || po.Block || po.Circle || '';
        const state = po.State || '';

        if (city && state) {
          const result = { city, state };
          pincodeCache.set(clean, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Pincode lookup network notice:', err);
  }

  return null;
}
