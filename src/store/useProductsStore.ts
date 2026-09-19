import { create } from 'zustand';
import { Product } from '../types';
import { adminApi } from '../lib/adminApi';
import { PRODUCTS } from '../data/products';

interface ProductsStoreState {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  fetchProducts: (params?: { search?: string; category?: string; force?: boolean }) => Promise<Product[]>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

export const useProductsStore = create<ProductsStoreState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  hasLoaded: false,

  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const list = await adminApi.getProducts(params);
      set({ products: list, loading: false, hasLoaded: true });
      return list;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load products', loading: false });
      return get().products;
    }
  },

  addProduct: (product) => {
    set((state) => {
      const filtered = state.products.filter((p) => p.id !== product.id && p.sku !== product.sku);
      return { products: [product, ...filtered] };
    });
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === id || (p as any)._id === id) {
          return { ...p, ...updates };
        }
        return p;
      }),
    }));
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id && (p as any)._id !== id),
    }));
  },
}));
