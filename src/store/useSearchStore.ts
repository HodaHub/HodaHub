import { create } from 'zustand';

interface SearchStore {
  searchQuery: string;
  selectedCategory: string;
  recentSearches: string[];
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  searchQuery: '',
  selectedCategory: 'All Categories',
  recentSearches: [
    'iPhone 15 Pro',
    'Sony WH-1000XM5',
    'MacBook Air M3',
    'Mechanical Keyboard',
    'Noise Cancelling Earbuds',
  ],

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  addRecentSearch: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    set((state) => ({
      recentSearches: [
        trimmed,
        ...state.recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 8),
    }));
  },
  clearRecentSearches: () => set({ recentSearches: [] }),
}));
