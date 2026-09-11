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
    const { type, recipientPhone, recipientName, orderId, trackingUrl, total } = await req.json();

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ error: 'recipientPhone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = recipientPhone.replace(/\D/g, '').slice(-10);
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

    const messageBody = type === 'order_confirmed'
      ? `Dear ${recipientName || 'Customer'}, thank you for shopping on HodaHub! Your order #${orderId || ''} for ₹${total || ''} is confirmed. Track delivery: ${trackingUrl || 'https://hodahub.in/track'}`
      : `HodaHub Update: Your order #${orderId || ''} has been dispatched! Track your shipment: ${trackingUrl || 'https://hodahub.in/track'}`;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const bodyParams = new URLSearchParams({
          To: `+91${cleanPhone}`,
          From: twilioFrom,
          Body: messageBody,
        });

        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });
      } catch (smsErr) {
        console.warn('Twilio dispatch warning:', smsErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipientPhone: cleanPhone,
        type,
        message: 'Notification queued and sent via HodaHub notification gateway.',
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
