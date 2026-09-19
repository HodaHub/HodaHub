import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, SlidersHorizontal, ArrowUpDown, X, Sparkles } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { CATEGORIES } from '../data/categories';
import { Product, SortOption } from '../types';
import { useFilterStore } from '../store/useFilterStore';
import { useSearchStore } from '../store/useSearchStore';
import { useProductsStore } from '../store/useProductsStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { ProductCard } from '../components/product/ProductCard';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { SEO } from '../components/common/SEO';
import { generateBreadcrumbSchema } from '../lib/jsonLd';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductListingPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  initialCategory?: string;
  initialSearch?: string;
  initialTag?: string;
}

export const ProductListingPage: React.FC<ProductListingPageProps> = ({
  onSelectProduct,
  onNavigate,
  initialCategory,
  initialSearch,
  initialTag,
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    priceRange,
    selectedBrands,
    minRating,
    discountRange,
    inStockOnly,
    assuredOnly,
    sortBy,
    setSortBy,
    toggleBrand,
    resetFilters,
  } = useFilterStore();

  const searchQuery = useSearchStore((state) => state.searchQuery);
  const { products: liveProducts, fetchProducts } = useProductsStore();
  const { fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const allProducts = liveProducts || [];

  // Trigger brief shimmer state on filter / initial load
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [initialCategory, initialSearch, initialTag, sortBy, priceRange, selectedBrands, minRating, discountRange, inStockOnly, assuredOnly]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Price -- Low to High', value: 'price-asc' },
    { label: 'Price -- High to Low', value: 'price-desc' },
    { label: 'Customer Rating', value: 'rating' },
    { label: 'Discount', value: 'discount' },
    { label: 'Newest First', value: 'newest' },
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: Product) => {
      // Category filter (flexible matching by slug, UUID, or name)
      if (initialCategory && initialCategory !== 'All' && initialCategory !== 'ALL') {
        const catTarget = initialCategory.toLowerCase();
        const matchesCategory =
          product.category?.toLowerCase() === catTarget ||
          (product as any).categoryId === initialCategory ||
          (product as any).categoryName?.toLowerCase() === catTarget;
        if (!matchesCategory) return false;
      }

      // Tag filter
      if (initialTag && product.tag !== initialTag && !product.highlights.some((h: string) => h.includes(initialTag))) {
        return false;
      }

      // Search term
      const query = (initialSearch || searchQuery).trim().toLowerCase();
      if (query) {
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesSKU = product.sku.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBrand && !matchesCategory && !matchesSKU) {
          return false;
        }
      }

      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      // Discount filter
      if (discountRange > 0 && product.discountPercent < discountRange) {
        return false;
      }

      // Stock filter
      if (inStockOnly && !product.inStock) {
        return false;
      }

      // Assured filter
      if (assuredOnly && !product.isAssured) {
        return false;
      }

      return true;
    }).sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'discount':
          return b.discountPercent - a.discountPercent;
        case 'newest':
          return b.id.localeCompare(a.id);
        case 'popularity':
        default:
          return b.ratingCount - a.ratingCount;
      }
    });
  }, [
    initialCategory,
    initialSearch,
    initialTag,
    searchQuery,
    priceRange,
    selectedBrands,
    minRating,
    discountRange,
    inStockOnly,
    assuredOnly,
    sortBy,
  ]);

  const currentCategoryName =
    CATEGORIES.find((c) => c.id === initialCategory)?.name || (initialCategory ? initialCategory : 'All Products');

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: currentCategoryName, url: initialCategory ? `/category/${initialCategory}` : '/plp' },
    ...(initialTag ? [{ name: initialTag, url: `/plp?tag=${initialTag}` }] : []),
  ];

  return (
    <div className="space-y-4 pb-12">
      <SEO
        title={`${currentCategoryName} | Buy Online at Best Price - HodaHub`}
        description={`Shop latest ${currentCategoryName} on HodaHub. Explore verified customer ratings, best discounts, HodaAssured warranty, and express delivery across India.`}
        canonicalUrl={initialCategory ? `https://hodahub.in/category/${initialCategory}` : 'https://hodahub.in/plp'}
        structuredData={generateBreadcrumbSchema(breadcrumbs)}
      />

      {/* 1. BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={() => onNavigate('home')}
          className="hover:text-primary-600 transition-colors"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">{currentCategoryName}</span>
        {initialTag && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-primary-600 font-bold">{initialTag}</span>
          </>
        )}
      </nav>

      {/* 2. MAIN LAYOUT: PERSISTENT LEFT SIDEBAR + RIGHT GRID */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar (Desktop Persistent) */}
        <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
          <FilterSidebar currentCategory={initialCategory} />
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header & Sort Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
                  <span>{currentCategoryName}</span>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    ({filteredProducts.length} items)
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% Genuine Products backed by HodaAssured
                </p>
              </div>

              {/* Mobile Triggers: Dual Bottom Sheet Triggers (Filters & Sort By) */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setIsMobileSortOpen(true)}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary-600" />
                  <span>Sort By</span>
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold rounded-xl border border-primary-200 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters {selectedBrands.length > 0 ? `(${selectedBrands.length})` : ''}</span>
                </button>
              </div>
            </div>

            {/* Desktop / Tablet Sort Toolbar */}
            <div className="hidden sm:flex pt-3 items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex-shrink-0 flex items-center gap-1 mr-1">
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort By:</span>
              </span>

              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                    sortBy === opt.value
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Active filter chips */}
            {selectedBrands.length > 0 && (
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Applied:</span>
                {selectedBrands.map((brand: string) => (
                  <span
                    key={brand}
                    className="bg-primary-50 text-primary-700 font-semibold px-2 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span>{brand}</span>
                    <button
                      onClick={() => toggleBrand(brand)}
                      className="hover:text-rose-600 focus:outline-none w-5 h-5 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-primary-600 hover:underline font-bold text-xs ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* MOBILE FILTER BOTTOM SHEET (< lg) */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <div className="fixed inset-0 z-50 flex items-end lg:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="relative w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Filters & Refinements</h3>
                      <p className="text-[11px] text-slate-500">Filter {currentCategoryName} on HodaHub</p>
                    </div>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                    <FilterSidebar currentCategory={initialCategory} />
                  </div>
                  <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
                    <button
                      onClick={resetFilters}
                      className="flex-1 py-3 bg-slate-100 text-slate-800 font-bold rounded-xl text-xs min-h-[44px]"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="flex-2 py-3 bg-primary-600 text-white font-bold rounded-xl text-xs min-h-[44px]"
                    >
                      Apply Filters ({filteredProducts.length} Results)
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MOBILE SORT BOTTOM SHEET (< sm) */}
          <AnimatePresence>
            {isMobileSortOpen && (
              <div className="fixed inset-0 z-50 flex items-end sm:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSortOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="relative w-full bg-white rounded-t-2xl shadow-2xl p-4 z-10 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="font-extrabold text-sm text-slate-900">Sort Products By</h3>
                    <button
                      onClick={() => setIsMobileSortOpen(false)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsMobileSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors min-h-[44px] ${
                          sortBy === opt.value
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && <ChevronRight className="w-4 h-4 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 3. DENSE PRODUCT GRID (4-5 per row on desktop) */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          ) : (
            /* No Results Empty State */
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No matching products found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try loosening your filters, broadening your price range, or searching for a different term.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
