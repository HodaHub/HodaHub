import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(count: number): string {
  return new Intl.NumberFormat('en-IN').format(count);
}

export function getDeliveryDateString(daysFromNow: number = 2): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Today by 9 PM";
  } else if (target.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow by 8 PM";
  }

  return target.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }) + " by 9 PM";
}

export interface PincodeInfo {
  valid: boolean;
  serviceable?: boolean;
  city?: string;
  state?: string;
  deliveryDays?: number;
  codAvailable?: boolean;
  freeDelivery?: boolean;
  error?: string;
}

export function verifyPincode(pincode: string): PincodeInfo {
  const cleaned = String(pincode || '').trim().replace(/\D/g, '');
  if (!/^\d{6}$/.test(cleaned) || cleaned.startsWith('0')) {
    return {
      valid: false,
      serviceable: false,
      error: 'Please enter a valid 6-digit pincode',
    };
  }

  return {
    valid: true,
    serviceable: true,
    freeDelivery: true,
    codAvailable: true,
  };
}

