import { create } from 'zustand';
import { adminApi, AdminCategory } from '../lib/adminApi';

interface CategoriesStoreState {
  categories: AdminCategory[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (data: {
    name: string;
    slug?: string;
    parentCategoryId?: string | null;
    imageUrl?: string;
    badge?: string;
    sortOrder?: number;
  }) => Promise<AdminCategory>;
  updateCategory: (id: string, updates: Partial<AdminCategory>) => Promise<AdminCategory>;
  deleteCategory: (id: string) => Promise<{ success: boolean; productCount?: number; message?: string }>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesStoreState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminApi.getCategories();
      set({ categories: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load categories', loading: false });
    }
  },

  createCategory: async (data) => {
    set({ loading: true });
    try {
      const created = await adminApi.createCategory(data);
      const current = get().categories;
      // Deduplicate: ensure an item with this id does not already exist in state
      const filtered = current.filter((c) => c.id !== created.id && c.slug !== created.slug);
      set({
        categories: [...filtered, created].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        loading: false,
      });
      return created;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  updateCategory: async (id, updates) => {
    set({ loading: true });
    try {
      const updated = await adminApi.updateCategory(id, updates);
      set((state) => ({
        categories: state.categories
          .map((c) => (c.id === id ? updated : c))
          .sort((a, b) => a.sortOrder - b.sortOrder),
        loading: false,
      }));
      return updated;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  deleteCategory: async (id) => {
    const result = await adminApi.deleteCategory(id);
    if (result.success) {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id && c.slug !== id),
      }));
    }
    return result;
  },

  reorderCategories: async (orderedIds) => {
    await adminApi.reorderCategories(orderedIds);
    set((state) => {
      const map = new Map(state.categories.map((c) => [c.id, c]));
      const reordered: AdminCategory[] = [];
      orderedIds.forEach((id, idx) => {
        const cat = map.get(id);
        if (cat) {
          reordered.push({ ...cat, sortOrder: idx + 1 });
        }
      });
      return { categories: reordered };
    });
  },
}));
