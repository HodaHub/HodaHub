import { create } from 'zustand';
import { SortOption } from '../types';

interface FilterStore {
  category: string;
  priceRange: [number, number];
  selectedBrands: string[];
  minRating: number;
  discountRange: number;
  inStockOnly: boolean;
  assuredOnly: boolean;
  sortBy: SortOption;

  setCategory: (category: string) => void;
  setPriceRange: (range: [number, number]) => void;
  toggleBrand: (brand: string) => void;
  setMinRating: (rating: number) => void;
  setDiscountRange: (discount: number) => void;
  setInStockOnly: (inStock: boolean) => void;
  setAssuredOnly: (assured: boolean) => void;
  setSortBy: (sortBy: SortOption) => void;
  resetFilters: () => void;
}

const initialFilters = {
  category: 'All',
  priceRange: [0, 200000] as [number, number],
  selectedBrands: [] as string[],
  minRating: 0,
  discountRange: 0,
  inStockOnly: false,
  assuredOnly: false,
  sortBy: 'popularity' as SortOption,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialFilters,

  setCategory: (category) => set({ category }),
  setPriceRange: (priceRange) => set({ priceRange }),
  toggleBrand: (brand) =>
    set((state) => {
      const exists = state.selectedBrands.includes(brand);
      return {
        selectedBrands: exists
          ? state.selectedBrands.filter((b) => b !== brand)
          : [...state.selectedBrands, brand],
      };
    }),
  setMinRating: (minRating) => set({ minRating }),
  setDiscountRange: (discountRange) => set({ discountRange }),
  setInStockOnly: (inStockOnly) => set({ inStockOnly }),
  setAssuredOnly: (assuredOnly) => set({ assuredOnly }),
  setSortBy: (sortBy) => set({ sortBy }),
  resetFilters: () => set(initialFilters),
}));
