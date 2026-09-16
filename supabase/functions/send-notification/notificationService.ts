import { NotificationPayload, resolveTemplateData } from './notificationTemplates.ts';

/**
 * HodaHub Notification Service (MSG91 Flow API)
 *
 * Dispatches DLT-compliant transactional order lifecycle SMS alerts
 * via MSG91 Flow endpoint.
 *
 * Brand: HodaHub
 */

export interface NotificationSendResult {
  success: boolean;
  type: string;
  recipientPhone: string;
  templateId?: string;
  message: string;
  msg91Response?: any;
}

export async function sendOrderNotification(payload: NotificationPayload): Promise<NotificationSendResult> {
  const cleanPhone = payload.recipientPhone.replace(/\D/g, '');
  const mobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const templateData = resolveTemplateData(payload);

  const authKey = Deno.env.get('MSG91_AUTH_KEY');
  const senderId = Deno.env.get('MSG91_SENDER_ID') || 'HODAHB';
  const templateId = Deno.env.get(templateData.templateIdEnvKey) || Deno.env.get('MSG91_TEMPLATE_ID_ORDER_PLACED');

  // If MSG91 is not configured yet (local development or sandbox)
  if (!authKey || !templateId) {
    console.warn(
      `HodaHub Notification: MSG91 credentials not fully configured (${templateData.templateIdEnvKey} or MSG91_AUTH_KEY missing). Simulating dispatch to ${mobile}: "${templateData.fallbackMessage}"`
    );
    return {
      success: true,
      type: payload.type,
      recipientPhone: mobile,
      templateId: templateId || 'DEV_MOCK_TEMPLATE',
      message: 'Notification queued (development simulation). Set MSG91 secrets for live delivery.',
    };
  }

  // MSG91 Flow API endpoint for DLT template variables
  const flowUrl = 'https://control.msg91.com/api/v5/flow/';

  const requestBody = {
    template_id: templateId,
    sender: senderId,
    short_url: '0',
    mobiles: mobile,
    ...templateData.variables,
  };

  const response = await fetch(flowUrl, {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok || (responseData.type && responseData.type === 'error')) {
    console.error(`HodaHub Notification: MSG91 Flow API delivery error:`, responseData);
    throw new Error(responseData.message || 'MSG91 notification delivery failed');
  }

  console.log(`HodaHub Notification: SMS sent to ${mobile} via template ${templateId}`);

  return {
    success: true,
    type: payload.type,
    recipientPhone: mobile,
    templateId,
    message: 'Notification sent successfully via HodaHub MSG91 gateway.',
    msg91Response: responseData,
  };
}
