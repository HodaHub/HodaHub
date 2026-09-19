import { supabase } from './supabase';

export interface CustomerInquiry {
  id?: string;
  ticketId: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status?: 'new' | 'in_progress' | 'resolved';
  createdAt?: string;
}

export const inquiryApi = {
  async submitInquiry(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }): Promise<{ success: boolean; ticketId: string; message: string }> {
    const ticketId = `INQ-${Date.now().toString().slice(-6)}`;
    const newInquiry: CustomerInquiry = {
      ticketId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      subject: data.subject?.trim() || 'General Inquiry',
      message: data.message.trim(),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    // 1. Try Supabase insert
    try {
      const { error } = await supabase.from('inquiries').insert({
        ticket_id: ticketId,
        name: newInquiry.name,
        email: newInquiry.email,
        phone: newInquiry.phone,
        subject: newInquiry.subject,
        message: newInquiry.message,
        status: 'new',
      });
      if (error) {
        console.warn('Supabase inquiries table notice (saving locally):', error.message);
      }
    } catch (e) {
      console.warn('Supabase inquiries exception:', e);
    }

    // 2. Always persist to localStorage for admin view and offline resilience
    try {
      const stored = JSON.parse(localStorage.getItem('hodahub_inquiries') || '[]');
      const filtered = (Array.isArray(stored) ? stored : []).filter((i: any) => i.ticketId !== ticketId);
      localStorage.setItem('hodahub_inquiries', JSON.stringify([newInquiry, ...filtered]));
    } catch (_) {}

    return {
      success: true,
      ticketId,
      message: 'Your inquiry has been submitted successfully.',
    };
  },

  async getInquiries(): Promise<CustomerInquiry[]> {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          ticketId: d.ticket_id || d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          subject: d.subject,
          message: d.message,
          status: d.status,
          createdAt: d.created_at,
        }));
      }
    } catch (_) {}

    try {
      const stored = JSON.parse(localStorage.getItem('hodahub_inquiries') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch (_) {
      return [];
    }
  },
};
