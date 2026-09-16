/**
 * HodaHub - Indian DLT Notification Templates & Variable Mappings
 *
 * Telecom regulatory compliance (TRAI / DLT) requires pre-approved
 * message templates for all transactional SMS in India. Freeform text
 * is blocked by telecom carriers.
 *
 * Brand: HodaHub
 */

export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'shipped'
  | 'order_dispatched'
  | 'out_for_delivery'
  | 'delivered';

export interface NotificationPayload {
  type: NotificationType;
  recipientPhone: string;
  recipientName?: string;
  orderId: string;
  total?: number | string;
  trackingUrl?: string;
  courierName?: string;
  awbNumber?: string;
}

export interface ResolvedTemplate {
  templateIdEnvKey: string;
  defaultTemplateId?: string;
  variables: Record<string, string>;
  fallbackMessage: string;
}

/**
 * Maps incoming notification parameters to DLT-compliant template variables
 * adhering to the MSG91 Flow parameter naming structure.
 */
export function resolveTemplateData(payload: NotificationPayload): ResolvedTemplate {
  const name = payload.recipientName?.trim() || 'Valued Customer';
  const orderId = payload.orderId || '';
  const total = payload.total ? `₹${payload.total}` : '';
  const trackingUrl = payload.trackingUrl || `https://hodahub.in/track-order?id=${orderId}`;
  const courier = payload.courierName || 'Delhivery';
  const awb = payload.awbNumber || '';

  switch (payload.type) {
    case 'order_placed':
    case 'order_confirmed':
      return {
        templateIdEnvKey: 'MSG91_TEMPLATE_ID_ORDER_PLACED',
        variables: {
          name,
          customer_name: name,
          order_id: orderId,
          total,
          tracking_url: trackingUrl,
          company: 'HodaHub',
        },
        fallbackMessage: `Dear ${name}, thank you for shopping on HodaHub! Your order #${orderId} of ${total} is confirmed. Track delivery: ${trackingUrl}`,
      };

    case 'shipped':
    case 'order_dispatched':
      return {
        templateIdEnvKey: 'MSG91_TEMPLATE_ID_SHIPPED',
        variables: {
          name,
          customer_name: name,
          order_id: orderId,
          courier_name: courier,
          awb_number: awb,
          tracking_url: trackingUrl,
          company: 'HodaHub',
        },
        fallbackMessage: `HodaHub Update: Your order #${orderId} has been shipped via ${courier} (AWB: ${awb}). Track your parcel: ${trackingUrl}`,
      };

    case 'out_for_delivery':
      return {
        templateIdEnvKey: 'MSG91_TEMPLATE_ID_OUT_FOR_DELIVERY',
        variables: {
          name,
          customer_name: name,
          order_id: orderId,
          courier_name: courier,
          tracking_url: trackingUrl,
          company: 'HodaHub',
        },
        fallbackMessage: `HodaHub Alert: Order #${orderId} is out for delivery today. Please ensure someone is available at your address. Live tracking: ${trackingUrl}`,
      };

    case 'delivered':
      return {
        templateIdEnvKey: 'MSG91_TEMPLATE_ID_DELIVERED',
        variables: {
          name,
          customer_name: name,
          order_id: orderId,
          tracking_url: trackingUrl,
          company: 'HodaHub',
        },
        fallbackMessage: `HodaHub: Your order #${orderId} has been delivered successfully. Thank you for shopping with HodaHub! Share feedback or request 10-day replacement: ${trackingUrl}`,
      };

    default:
      return {
        templateIdEnvKey: 'MSG91_TEMPLATE_ID_ORDER_PLACED',
        variables: {
          name,
          order_id: orderId,
          tracking_url: trackingUrl,
          company: 'HodaHub',
        },
        fallbackMessage: `HodaHub notification for order #${orderId}. Track status: ${trackingUrl}`,
      };
  }
}
