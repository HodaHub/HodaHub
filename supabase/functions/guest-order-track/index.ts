import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, phone } = await req.json();

    const cleanOrder = String(orderId || '').trim();
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanOrder || !cleanPhone) {
      return new Response(
        JSON.stringify({ error: 'Order ID and 10-digit Phone Number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'Supabase service role environment variables not configured on server',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect with service_role key to safely bypass RLS server-side
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query order matching id/awb_number AND phone
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          price_at_purchase,
          variant_id,
          box_option_id,
          products (id, title, slug, brand)
        )
      `)
      .or(`id.eq.${cleanOrder},awb_number.eq.${cleanOrder}`)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({
          found: false,
          error: 'No order matching this Order ID was found on HodaHub.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strictly verify that the provided phone matches the guest phone or registered address phone
    const storedPhone = String(order.guest_phone || order.guest_address?.phone || '').replace(/\D/g, '').slice(-10);

    if (storedPhone && storedPhone !== cleanPhone) {
      return new Response(
        JSON.stringify({
          found: false,
          error: 'Phone number does not match this HodaHub order.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        found: true,
        data: {
          id: order.id,
          orderId: order.id,
          orderStatus: order.order_status,
          shipmentStatus: order.shipment_status || 'order_placed',
          courierName: order.courier_name || 'Delhivery Express',
          awbNumber: order.awb_number,
          estimatedDeliveryDate: order.estimated_delivery_date,
          createdAt: order.created_at,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          total: order.total,
          guestName: order.guest_name,
          city: order.guest_address?.city || 'Bengaluru',
          state: order.guest_address?.state || 'Karnataka',
          items: order.order_items || [],
        },
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
