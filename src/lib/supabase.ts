import { createClient } from '@supabase/supabase-js';

// Environment variable configuration for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface SupabaseAddress {
  id: string;
  user_id: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at?: string;
}

export interface SupabaseOrder {
  id: string;
  user_id: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_address?: any;
  is_guest_order: boolean;
  payment_method: 'razorpay_upi' | 'cod';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  subtotal: number;
  box_total: number;
  discount: number;
  total: number;
  order_status: string;
  awb_number?: string | null;
  courier_name?: string | null;
  shipment_status?: string | null;
  estimated_delivery_date?: string | null;
  created_at?: string;
}

export interface SupabaseProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  mrp: number;
  category_id?: string | null;
  brand: string;
  stock: number;
  sku?: string | null;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  created_at?: string;
}
