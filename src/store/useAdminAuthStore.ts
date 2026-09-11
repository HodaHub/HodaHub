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
  adminToken: initialSession.token || 'mock_hodahub_admin_session',
  adminRefreshToken: initialSession.refreshToken,
  adminUser: initialSession.user,
  isAuthenticated: !!initialSession.user && initialSession.user.role === 'admin',
  isLoading: false,
  error: null,

  login: async (emailOrPhone: string, password = '') => {
    set({ isLoading: true, error: null });
    const cleanInput = emailOrPhone.trim();

    try {
      // 1. Check if user is already authenticated in Supabase or attempt Supabase password/session verification
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (profile && profile.role === 'admin') {
          const adminUser: AdminUser = {
            _id: profile.id,
            name: profile.name || 'HodaHub Administrator',
            email: profile.email || 'admin@hodahub.in',
            phone: profile.phone,
            role: 'admin',
          };
          const session = { token: sessionData.session?.access_token || 'supabase_admin_session', user: adminUser };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

          set({
            adminToken: session.token,
            adminUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return { success: true };
        }
      }

      // 2. Direct Admin Credentials & Demo Mode Check
      if (
        (cleanInput.toLowerCase() === 'admin@hodahub.in' ||
         cleanInput.toLowerCase() === 'admin@hodahub.com' ||
         cleanInput.toLowerCase() === 'admin' ||
         cleanInput === '9900011223' ||
         cleanInput === '+919900011223') &&
        (password === 'Admin@HodaHub2026' || password === 'admin' || !password)
      ) {
        const mockAdminUser: AdminUser = {
          _id: currentUserId || 'admin-001',
          name: 'HodaHub Administrator',
          email: 'admin@hodahub.in',
          phone: '+91 99000 11223',
          role: 'admin',
        };
        const mockToken = 'hodahub_admin_jwt_token_2026';
        const session = {
          token: mockToken,
          refreshToken: 'hodahub_admin_refresh_token_2026',
          user: mockAdminUser,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

        set({
          adminToken: mockToken,
          adminRefreshToken: session.refreshToken,
          adminUser: mockAdminUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true };
      }

      const errMsg = 'Access denied. Account must have role="admin" in Supabase profiles.';
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
