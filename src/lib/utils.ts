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
  city?: string;
  state?: string;
  deliveryDays?: number;
  codAvailable?: boolean;
  freeDelivery?: boolean;
}

export function verifyPincode(pincode: string): PincodeInfo {
  const cleaned = pincode.trim();
  if (!/^\d{6}$/.test(cleaned)) {
    return { valid: false };
  }

  const firstDigit = cleaned[0];
  const pincodeMap: Record<string, { city: string; state: string; days: number }> = {
    '1': { city: 'New Delhi', state: 'Delhi', days: 1 },
    '2': { city: 'Lucknow', state: 'Uttar Pradesh', days: 2 },
    '3': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
    '4': { city: 'Mumbai', state: 'Maharashtra', days: 1 },
    '5': { city: 'Hyderabad', state: 'Telangana', days: 1 },
    '6': { city: 'Chennai', state: 'Tamil Nadu', days: 2 },
    '7': { city: 'Kolkata', state: 'West Bengal', days: 2 },
    '8': { city: 'Patna', state: 'Bihar', days: 3 },
    '9': { city: 'Pune', state: 'Maharashtra', days: 2 },
  };

  const info = pincodeMap[firstDigit] || { city: 'Bangalore', state: 'Karnataka', days: 1 };
  return {
    valid: true,
    city: info.city,
    state: info.state,
    deliveryDays: info.days,
    codAvailable: true,
    freeDelivery: true,
  };
}
