/**
 * WhatsApp OTP Client Service
 * Connects to the local/self-hosted WhatsApp Gateway (port 3001)
 */

const GATEWAY_URL = (import.meta.env.VITE_WHATSAPP_GATEWAY_URL as string) || 'http://localhost:3001';

export interface WhatsAppGatewayStatus {
  isConnected: boolean;
  userPhone?: string;
  hasQr: boolean;
}

export const checkWhatsAppGateway = async (): Promise<WhatsAppGatewayStatus> => {
  try {
    const res = await fetch(`${GATEWAY_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { isConnected: false, hasQr: false };
    return await res.json();
  } catch (_e) {
    return { isConnected: false, hasQr: false };
  }
};

export const sendWhatsAppOtp = async (
  phone10Digits: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanPhone = phone10Digits.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return { success: false, error: 'Invalid 10-digit Indian phone number' };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true };
    }
    return {
      success: false,
      error: data.error || 'Failed to dispatch OTP over WhatsApp',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'WhatsApp gateway server is not running on port 3001',
    };
  }
};

export const verifyWhatsAppOtp = async (
  phone10Digits: string,
  otp: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanPhone = phone10Digits.replace(/\D/g, '').slice(-10);
  const cleanOtp = otp.trim();

  try {
    const res = await fetch(`${GATEWAY_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true };
    }
    return {
      success: false,
      error: data.error || 'Invalid or expired OTP',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'WhatsApp gateway server unavailable',
    };
  }
};
