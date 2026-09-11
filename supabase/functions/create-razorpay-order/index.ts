import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'INR', orderId, notes = {} } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valid amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const amountInPaisa = Math.round(amount * 100);

    // If live keys are configured, call Razorpay API securely server-side
    if (keyId && keySecret) {
      const basicAuth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaisa,
          currency: currency.toUpperCase(),
          receipt: orderId || `hoda_${Date.now()}`,
          notes: {
            brand: 'HodaHub',
            orderId: orderId || '',
            ...notes,
          },
        }),
      });

      const rzpData = await rzpRes.json();

      if (!rzpRes.ok) {
        throw new Error(rzpData.error?.description || 'Failed to create Razorpay order');
      }

      return new Response(
        JSON.stringify({
          gateway: 'razorpay',
          gatewayOrderId: rzpData.id,
          keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          receipt: rzpData.receipt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Graceful test/mock fallback for local dev when secret keys have not yet been provisioned
    const mockOrderId = `order_hoda_${Date.now()}`;
    return new Response(
      JSON.stringify({
        gateway: 'razorpay',
        gatewayOrderId: mockOrderId,
        keyId: keyId || 'rzp_test_HodaHubSandbox',
        amount: amountInPaisa,
        currency: 'INR',
        receipt: orderId || mockOrderId,
        isMock: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
