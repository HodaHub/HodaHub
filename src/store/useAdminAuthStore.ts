import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin';
}

interface AdminAuthState {
  adminToken: string | null;
  adminRefreshToken: string | null;
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => boolean;
}

const STORAGE_KEY = 'hodahub_admin_session';

const getInitialSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, refreshToken: null, user: null };
    const parsed = JSON.parse(raw);
    if (parsed.user?.role === 'admin') {
      return parsed;
    }
    return { token: null, refreshToken: null, user: null };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
};

const initialSession = getInitialSession();

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  adminToken: initialSession.token || null,
  adminRefreshToken: initialSession.refreshToken || null,
  adminUser: initialSession.user,
  isAuthenticated: !!initialSession.user && initialSession.user.role === 'admin' && !!initialSession.token,
  isLoading: false,
  error: null,

  login: async (emailOrPhone: string, password = '') => {
    set({ isLoading: true, error: null });
    const cleanInput = emailOrPhone.trim();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      const errMsg = 'Please enter both your admin email and security password.';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    }

    try {
      // 1. Try real Supabase email/password authentication if available
      if (cleanInput.includes('@')) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanInput,
            password: cleanPassword,
          });

          if (!authErr && authData?.user && authData?.session) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            if (profile && profile.role === 'admin') {
              const adminUser: AdminUser = {
                _id: profile.id,
                name: profile.name || 'Administrator',
                email: profile.email || cleanInput,
                phone: profile.phone,
                role: 'admin',
              };
              const session = {
                token: authData.session.access_token,
                refreshToken: authData.session.refresh_token,
                user: adminUser,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

              set({
                adminToken: session.token,
                adminRefreshToken: session.refreshToken,
                adminUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return { success: true };
            }
          }
        } catch {
          // Fall through to configured credentials check
        }
      }

      // 2. Configured Admin Credentials from Environment Variables
      const configuredEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hodahub.in').trim().toLowerCase();
      const configuredPassword = (import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@HodaHub2026').trim();

      if (
        cleanInput.toLowerCase() === configuredEmail &&
        cleanPassword === configuredPassword
      ) {
        const adminUser: AdminUser = {
          _id: 'admin_root',
          name: 'HodaHub Administrator',
          email: configuredEmail,
          role: 'admin',
        };
        const token = `hodahub_adm_${Date.now()}`;
        const session = {
          token,
          refreshToken: `ref_${Date.now()}`,
          user: adminUser,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

        set({
          adminToken: token,
          adminRefreshToken: session.refreshToken,
          adminUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      const errMsg = 'Invalid administrator credentials. Access denied.';
      set({ isLoading: false, error: errMsg });
      return { success: false, error: errMsg };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Authentication error' });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      adminToken: null,
      adminRefreshToken: null,
      adminUser: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  checkAuth: () => {
    const { isAuthenticated, adminUser } = get();
    return !!(isAuthenticated && adminUser && adminUser.role === 'admin');
  },
}));
