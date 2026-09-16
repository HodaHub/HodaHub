import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { NotificationPayload } from './notificationTemplates.ts';
import { sendOrderNotification } from './notificationService.ts';

/**
 * HodaHub - Order Lifecycle Notifications Edge Function
 *
 * Sends transactional SMS notifications (order confirmed, shipped, out for delivery, delivered)
 * via MSG91 Flow API with Indian DLT-registered templates.
 *
 * Brand: HodaHub
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const body = await req.json();
    const {
      type = 'order_confirmed',
      recipientPhone,
      recipientName,
      orderId,
      trackingUrl,
      total,
      courierName,
      awbNumber,
    } = body;

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ error: 'recipientPhone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: NotificationPayload = {
      type,
      recipientPhone,
      recipientName,
      orderId: orderId || '',
      trackingUrl,
      total,
      courierName,
      awbNumber,
    };

    const result = await sendOrderNotification(payload);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('HodaHub Notification function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
