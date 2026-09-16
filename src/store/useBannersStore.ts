import { create } from 'zustand';
import { adminApi, AdminBanner } from '../lib/adminApi';

interface BannersStoreState {
  banners: AdminBanner[];
  liveBanners: AdminBanner[];
  loading: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  fetchLiveBanners: () => Promise<void>;
  createBanner: (data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    isActive?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    sortOrder?: number;
  }) => Promise<AdminBanner>;
  updateBanner: (id: string, updates: Partial<AdminBanner>) => Promise<AdminBanner>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerActive: (id: string, isActive: boolean) => Promise<void>;
}

export const useBannersStore = create<BannersStoreState>((set, get) => ({
  banners: [],
  liveBanners: [],
  loading: false,
  error: null,

  fetchBanners: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminApi.getBanners();
      set({ banners: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch banners', loading: false });
    }
  },

  fetchLiveBanners: async () => {
    try {
      const live = await adminApi.getLiveHeroBanners();
      set({ liveBanners: live });
    } catch (err) {
      console.warn('[HodaHub Banners] fetchLiveBanners error:', err);
    }
  },

  createBanner: async (data) => {
    set({ loading: true });
    try {
      const created = await adminApi.createBanner(data);
      const updatedList = [...get().banners, created].sort((a, b) => a.sortOrder - b.sortOrder);
      set({ banners: updatedList, loading: false });
      get().fetchLiveBanners();
      return created;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  updateBanner: async (id, updates) => {
    set({ loading: true });
    try {
      const updated = await adminApi.updateBanner(id, updates);
      set((state) => ({
        banners: state.banners
          .map((b) => (b.id === id ? updated : b))
          .sort((a, b) => a.sortOrder - b.sortOrder),
        loading: false,
      }));
      get().fetchLiveBanners();
      return updated;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  deleteBanner: async (id) => {
    await adminApi.deleteBanner(id);
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== id),
    }));
    get().fetchLiveBanners();
  },

  toggleBannerActive: async (id, isActive) => {
    await adminApi.toggleBannerActive(id, isActive);
    set((state) => ({
      banners: state.banners.map((b) => (b.id === id ? { ...b, isActive } : b)),
    }));
    get().fetchLiveBanners();
  },
}));
