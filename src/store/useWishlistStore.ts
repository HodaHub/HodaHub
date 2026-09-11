import { create } from 'zustand';
import { Product } from '../types';

interface WishlistStore {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],

  toggleWishlist: (product) => {
    const exists = get().items.some((item) => item.id === product.id);
    if (exists) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== product.id),
      }));
    } else {
      set((state) => ({
        items: [...state.items, product],
      }));
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.id === productId);
  },

  removeFromWishlist: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));
