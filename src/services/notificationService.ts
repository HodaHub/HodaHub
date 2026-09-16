import { supabase } from '../lib/supabase';

/**
 * HodaHub Frontend Notification Service
 * Dispatches order lifecycle SMS notifications by invoking the Supabase
 * 'send-notification' Edge Function (backed by MSG91 DLT templates).
 *
 * Brand: HodaHub
 */

export interface SendNotificationParams {
  type: 'order_placed' | 'order_confirmed' | 'shipped' | 'order_dispatched' | 'out_for_delivery' | 'delivered';
  recipientPhone: string;
  recipientName?: string;
  orderId: string;
  total?: number | string;
  trackingUrl?: string;
  courierName?: string;
  awbNumber?: string;
}

export async function triggerOrderNotification(params: SendNotificationParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: params,
    });

    if (error) {
      console.warn('HodaHub notification notice:', error.message);
      return false;
    }

    return data?.success ?? true;
  } catch (err) {
    console.warn('HodaHub notification dispatch failed:', err);
    return false;
  }
}
