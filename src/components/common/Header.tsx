import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  X,
  PhoneCall,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Shirt,
  Armchair,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  Menu,
  Loader2,
} from 'lucide-react';
import { useCartStore, calculateItemUnitPrice } from '../../store/useCartStore';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useSearchStore } from '../../store/useSearchStore';
import { useFilterStore } from '../../store/useFilterStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CATEGORIES } from '../../data/categories';
import { formatPrice } from '../../lib/utils';
import { searchHodaHub, SearchHit } from '../../services/searchApi';

interface HeaderProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  activePage?: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activePage: _activePage }) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryNavRef = useRef<HTMLDivElement>(null);

  const cartCount = useCartStore((state) => state.getTotalCount());
  const cartItems = useCartStore((state) => state.items);
  const cartSubtotal = useCartStore((state) => state.getSubtotal());

  const wishlistCount = useWishlistStore((state) => state.items.length);

  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory, recentSearches, addRecentSearch } =
    useSearchStore();
  const setCategoryFilter = useFilterStore((state) => state.setCategory);

  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();

  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSpeedMs, setSearchSpeedMs] = useState<number | null>(null);

  // Close search suggestions & category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
      }
      if (
        categoryNavRef.current &&
        !categoryNavRef.current.contains(event.target as Node)
      ) {
        setHoveredCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Predictive search query to Meilisearch endpoint with ~100-200ms debounce
  useEffect(() => {
    const clean = searchQuery.trim();
    if (!clean) {
      setSearchHits([]);
      setIsSearching(false);
      setSearchSpeedMs(null);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await searchHodaHub(clean, {
          limit: 6,
          category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
          signal: controller.signal,
        });
        setSearchHits(res.hits);
        setSearchSpeedMs(res.processingTimeMs);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.warn('[HodaHub Search] Query error:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCategory]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      setShowSearchSuggestions(false);
      onNavigate('plp', { search: searchQuery });
    }
  };

  const handleSuggestionClick = (title: string, productId?: string) => {
    setSearchQuery(title);
    addRecentSearch(title);
    setShowSearchSuggestions(false);
    if (productId) {
      onNavigate('pdp', { productId });
    } else {
      onNavigate('plp', { search: title });
    }
  };

  const handleCategoryNavClick = (catId: string) => {
    setSelectedCategory(catId);
    setCategoryFilter(catId);
    onNavigate('plp', { category: catId });
    setHoveredCategory(null);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    mobiles: <Smartphone className="w-4 h-4 text-primary-500" strokeWidth={1.5} />,
    electronics: <Laptop className="w-4 h-4 text-primary-500" strokeWidth={1.5} />,
    appliances: <Tv className="w-4 h-4 text-primary-500" strokeWidth={1.5} />,
    fashion: <Shirt className="w-4 h-4 text-primary-500" strokeWidth={1.5} />,
    home: <Armchair className="w-4 h-4 text-primary-500" strokeWidth={1.5} />,
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm transition-shadow duration-200">
      {/* 1. TOP UTILITY BAR (HodaHub structural density with sleek 2026 styling) */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1 px-3 sm:px-8 border-b border-slate-800 w-full max-w-full overflow-x-auto no-scrollbar">
        <div className="min-w-max md:min-w-0 max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center space-x-4 sm:space-x-6 flex-shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>India's Verified Next-Gen E-Commerce</span>
            </span>
            <button
              onClick={() => alert('HodaHub Seller Hub: Join 500,000+ verified Indian merchants.')}
              className="hover:text-white transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>Become a HodaSeller</span>
            </button>
            <button
              onClick={() => onNavigate('plp', { tag: 'Deal of the Day' })}
              className="hover:text-amber-400 transition-colors flex items-center gap-1 font-medium text-amber-300 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Offer Zone</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1 py-0.2 rounded font-bold border border-amber-500/30">
                LIVE
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-4 sm:space-x-5 font-medium flex-shrink-0">
            <button
              onClick={() => alert('HodaHub 24x7 Helpline: 1800-202-6000')}
              className="hover:text-white transition-colors flex items-center gap-1 text-slate-300 whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 text-primary-400" />
              <span>24x7 Support</span>
            </button>
            <button
              onClick={() => onNavigate(isAuthenticated ? 'orders' : 'track-order')}
              className="hover:text-white transition-colors flex items-center gap-1 text-slate-300 whitespace-nowrap"
            >
              <Package className="w-3.5 h-3.5 text-primary-400" />
              <span>Track Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR (Responsive across mobile, tablet, and desktop) */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-3 w-full max-w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 md:gap-6 min-w-0">
          {/* Mobile Hamburger + BRAND LOGO */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open Category Menu"
              className="md:hidden w-9 h-9 flex items-center justify-center text-slate-700 hover:text-primary-600 rounded-lg hover:bg-slate-100 focus:outline-none cursor-pointer -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 text-left focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center shadow-xs sm:shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-950 font-sans">
                    Hoda<span className="text-primary-600">Hub</span>
                  </span>
                  <span className="hidden xs:inline text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider font-mono">
                    Plus
                  </span>
                </div>
                <span className="hidden sm:inline text-[10px] text-slate-500 font-medium tracking-tight -mt-0.5">
                  Explore <span className="text-primary-600 font-semibold">Assured</span>
                </span>
              </div>
            </button>
          </div>

          {/* SEARCH BAR (Hidden on mobile < md, scales smoothly from tablet to 2xl desktop) */}
          <div
            ref={searchContainerRef}
            className="hidden md:flex flex-1 md:max-w-md lg:max-w-lg xl:max-w-2xl 2xl:max-w-3xl relative mx-1 sm:mx-2 lg:mx-4 transition-all duration-200"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="w-full flex items-center border-2 border-slate-200 hover:border-primary-400 focus-within:border-primary-500 rounded-lg bg-slate-50/70 overflow-hidden transition-all duration-200 shadow-sm"
            >
              {/* Category Dropdown inside search */}
              <div className="relative hidden md:block flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="h-11 px-3 bg-slate-100/90 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-1.5 border-r border-slate-200 focus:outline-none transition-colors"
                >
                  <span className="max-w-[110px] truncate">
                    {selectedCategory === 'All Categories' ? 'All Categories' : CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showCategoryDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg shadow-dropdown border border-slate-200 py-1.5 z-50 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All Categories');
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-between"
                    >
                      <span>All Categories</span>
                      {selectedCategory === 'All Categories' && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-between"
                      >
                        <span>{cat.name}</span>
                        {selectedCategory === cat.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex-1 flex items-center px-3 min-w-0">
                <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" strokeWidth={1.5} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  placeholder="Search for Mobiles, Laptops, Headphones, Brands and more..."
                  className="w-full py-2.5 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-primary-600 animate-spin mr-1.5 flex-shrink-0" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchHits([]);
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Action Button */}
              <button
                type="submit"
                className="h-11 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold flex items-center justify-center transition-colors shadow-sm flex-shrink-0 whitespace-nowrap"
              >
                <span>Search</span>
              </button>
            </form>

            {/* PREDICTIVE SEARCH AUTOCOMPLETE / RECENT SEARCHES MODAL */}
            <AnimatePresence>
              {showSearchSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-dropdown border border-slate-200/90 overflow-hidden z-50 p-2"
                >
                  {/* Search Engine Telemetry & Header */}
                  {searchQuery.trim() && (
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                      <span className="uppercase tracking-wider">
                        {isSearching ? 'Searching HodaHub Catalog...' : `${searchHits.length} Matches Found`}
                      </span>
                      {searchSpeedMs !== null && !isSearching && (
                        <span className="flex items-center gap-1 text-emerald-600 font-mono text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>~{searchSpeedMs}ms • Typo-Tolerant</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Matching Products */}
                  {searchHits.length > 0 && (
                    <div className="my-1">
                      {searchHits.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSuggestionClick(prod.title, prod.id)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-primary-50/70 rounded-lg group transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <img
                              src={prod.images[0]}
                              alt={prod.title}
                              className="w-9 h-9 object-contain rounded border border-slate-100 bg-slate-50 p-0.5 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div
                                className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 line-clamp-1"
                                dangerouslySetInnerHTML={{
                                  __html: prod._formatted?.title || prod.title,
                                }}
                              />
                              <div className="text-xs text-slate-500 font-medium">
                                in <span className="capitalize">{prod.categoryName || prod.category}</span>
                                {prod.isAssured && (
                                  <span className="ml-2 text-[10px] bg-primary-50 text-primary-700 font-bold px-1.5 py-0.5 rounded">
                                    HodaAssured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right tabular-nums font-mono text-xs font-bold text-slate-900 flex-shrink-0">
                            {formatPrice(prod.price)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Zero-result empty state */}
                  {!isSearching && searchQuery.trim() && searchHits.length === 0 && (
                    <div className="py-6 px-4 text-center">
                      <p className="text-sm font-bold text-slate-700">
                        No matches found for "{searchQuery}"
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try searching for generic terms like <span className="font-semibold text-primary-600">mobiles</span>, <span className="font-semibold text-primary-600">laptop</span>, or <span className="font-semibold text-primary-600">headphones</span>.
                      </p>
                    </div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className={searchHits.length > 0 ? 'pt-1.5 border-t border-slate-100' : ''}>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
                        <span>Recent Searches</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-2">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSuggestionClick(term)}
                            className="text-xs bg-slate-100 hover:bg-primary-100 hover:text-primary-700 text-slate-700 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Mobile Search Icon Trigger (Opens full-width overlay) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(true);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 150);
              }}
              aria-label="Search HodaHub products"
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 hover:text-primary-600 focus:outline-none cursor-pointer"
            >
              <Search className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* USER LOGIN / ACCOUNT */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors font-semibold text-sm focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs border border-primary-200">
                    <User className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span className="hidden lg:inline font-bold">
                    {user?.name?.split(' ')[0] || user?.phone || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors font-bold text-xs shadow-xs"
                  title="Sign In"
                >
                  <User className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-dropdown border border-slate-200 py-2 z-50 text-sm"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Signed in with</p>
                      <p className="font-bold text-slate-900 truncate">
                        {user?.phone || user?.email || 'HodaHub Customer'}
                      </p>
                      <span className="inline-block mt-1 text-[11px] bg-primary-50 text-primary-700 font-bold px-1.5 py-0.5 rounded">
                        {user?.role === 'admin' ? 'Administrator' : 'HodaHub Plus Member'}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('account');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-700 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('account', { tab: 'orders' });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-700 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Orders & Returns</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('wishlist');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-700 text-slate-700 flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>My Wishlist ({wishlistCount})</span>
                      </button>

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('admin-orders');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-700 text-primary-700 flex items-center gap-2.5 font-bold transition-colors border-t border-slate-100 mt-1 pt-2"
                        >
                          <Truck className="w-4 h-4 text-primary-600" />
                          <span>Admin Delivery Panel</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 font-bold transition-colors border-t border-slate-100 mt-1 pt-2"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* WISHLIST BUTTON (Visible from sm breakpoint upwards to preserve 320px mobile space) */}
            <button
              onClick={() => onNavigate('wishlist')}
              className="hidden sm:flex relative p-2 sm:p-2.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-primary-600 transition-colors focus:outline-none"
              title="Saved in Wishlist"
            >
              <Heart className="w-5 h-5" strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* CART BUTTON WITH SCALE-POP MICRO-ANIMATION ON QUANTITY CHANGE */}
            <div
              className="relative"
              onMouseEnter={() => setShowCartPreview(true)}
              onMouseLeave={() => setShowCartPreview(false)}
            >
              <button
                id="header-cart-button"
                onClick={() => onNavigate('cart')}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-lg bg-primary-50 hover:bg-primary-100/80 border border-primary-200 text-primary-700 font-bold text-xs sm:text-sm transition-all duration-200 focus:outline-none flex-shrink-0"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" strokeWidth={2} />
                  {/* Cart badge: scale-pop micro-animation on quantity change (spring easing) */}
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 15,
                        }}
                        className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-extrabold rounded-full flex items-center justify-center font-mono shadow-xs"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="hidden md:inline font-bold">Cart</span>
              </button>

              {/* Cart Flyout Hover Preview */}
              <AnimatePresence>
                {showCartPreview && cartItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-dropdown border border-slate-200 p-3 z-50 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800">
                        Cart Preview ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                      </span>
                      <span className="text-primary-600 font-mono font-bold">
                        {formatPrice(cartSubtotal)}
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 py-1">
                      {cartItems.slice(0, 3).map((item) => (
                        <div key={item.product.id} className="py-2 flex items-center gap-2">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="w-10 h-10 object-contain rounded border border-slate-100 p-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{item.product.title}</p>
                            <p className="text-slate-500 font-mono">
                              Qty: {item.quantity} × {formatPrice(calculateItemUnitPrice(item))}
                            </p>
                          </div>
                        </div>
                      ))}
                      {cartItems.length > 3 && (
                        <p className="text-center text-slate-400 py-1 font-medium">
                          +{cartItems.length - 3} more items in cart
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowCartPreview(false);
                        onNavigate('cart');
                      }}
                      className="w-full mt-2 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Go to Cart</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUBHEADER CATEGORY NAV RAIL */}
      <div
        ref={categoryNavRef}
        className="bg-white border-t border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] w-full max-w-full overflow-x-auto md:overflow-visible no-scrollbar relative z-30"
      >
        <div className="min-w-max md:min-w-0 max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-1 sm:gap-2 md:justify-between text-xs font-semibold text-slate-700 flex-nowrap">
          <button
            onClick={() => onNavigate('plp', { tag: 'Deal of the Day' })}
            className="flex items-center gap-1.5 py-2 sm:py-2.5 px-2 sm:px-3 hover:text-primary-600 hover:bg-primary-50/60 rounded-md transition-colors whitespace-nowrap text-primary-600 font-bold flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Top Deals</span>
          </button>

          {CATEGORIES.map((cat, idx) => (
            <div
              key={cat.id}
              className={`relative group py-2 sm:py-2.5 flex-shrink-0 ${
                hoveredCategory === cat.id ? 'z-50' : 'z-10'
              }`}
              onMouseEnter={() => setHoveredCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredCategory(hoveredCategory === cat.id ? null : cat.id);
                }}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-semibold text-slate-800 flex-shrink-0 ${
                  hoveredCategory === cat.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'hover:bg-slate-100 hover:text-primary-600'
                }`}
                aria-expanded={hoveredCategory === cat.id}
              >
                {categoryIcons[cat.id] || null}
                <span>{cat.name}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    hoveredCategory === cat.id ? 'rotate-180 text-primary-600' : 'group-hover:rotate-180'
                  }`}
                />
              </button>

              {/* Mega Category Dropdown (Hover and Click Supported, Unclipped) */}
              <AnimatePresence>
                {hoveredCategory === cat.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute ${
                      idx >= 4 ? 'right-0' : 'left-0'
                    } top-full mt-0 pt-1.5 w-64 sm:w-72 z-50 pointer-events-auto`}
                  >
                    <div className="bg-white rounded-xl shadow-dropdown border border-slate-200/90 p-3 relative before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Popular in {cat.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCategoryNavClick(cat.id)}
                          className="text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-0.5"
                        >
                          <span>View All</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(cat.id);
                              onNavigate('plp', { category: cat.id, subcategory: sub });
                              setHoveredCategory(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-primary-50 hover:text-primary-600 text-slate-700 font-medium transition-colors text-xs flex items-center justify-between group/item"
                          >
                            <span>{sub}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 text-primary-600 transition-opacity" />
                          </button>
                        ))}
                      </div>
                      {cat.badge && (
                        <div
                          onClick={() => handleCategoryNavClick(cat.id)}
                          className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-amber-100/80 transition-colors"
                        >
                          <span>{cat.badge}</span>
                          <span>Shop Now →</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <button
            onClick={() => onNavigate('plp')}
            className="py-2 sm:py-2.5 px-3 hover:text-primary-600 text-slate-500 font-bold transition-colors whitespace-nowrap flex-shrink-0"
          >
            All Products →
          </button>
        </div>
      </div>

      {/* MOBILE CATEGORY SLIDE-IN DRAWER (< md) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-base tracking-tight font-sans">
                    Hoda<span className="text-primary-400">Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 space-y-4 text-xs font-semibold">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Browse Categories
                  </p>
                  <div className="space-y-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onNavigate('plp', { category: cat.id });
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary-50 text-slate-800 hover:text-primary-700 flex items-center justify-between transition-colors min-h-[44px]"
                      >
                        <span className="font-bold">{cat.name}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onNavigate(isAuthenticated ? 'orders' : 'track-order');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 min-h-[44px]"
                  >
                    <Package className="w-4 h-4 text-primary-600" />
                    <span>Track Your Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onNavigate('wishlist');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 min-h-[44px]"
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      alert('HodaHub 24x7 Support: 1800-202-6000');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center gap-2 min-h-[44px]"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>24x7 Customer Helpline</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL-WIDTH MOBILE SEARCH OVERLAY (< md) */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 md:hidden bg-white flex flex-col"
          >
            <div className="p-3 border-b border-slate-200 flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e);
                  setIsMobileSearchOpen(false);
                }}
                className="flex-1 flex items-center bg-slate-100 rounded-xl px-3 py-1"
              >
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mobiles, electronics, fashion..."
                  className="w-full py-2 bg-transparent text-sm text-slate-900 focus:outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-8 h-8 flex items-center justify-center text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="w-12 h-11 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-primary-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Quick Suggestions in mobile search */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Live Matching Products in Mobile */}
              {searchHits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Matches ({searchHits.length})
                    </p>
                    {searchSpeedMs !== null && (
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ~{searchSpeedMs}ms
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {searchHits.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          handleSuggestionClick(prod.title, prod.id);
                          setIsMobileSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 hover:bg-primary-50 rounded-lg text-left border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <img
                            src={prod.images[0]}
                            alt={prod.title}
                            className="w-9 h-9 object-contain rounded bg-slate-50 border border-slate-200 p-0.5 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className="font-semibold text-slate-900 text-xs truncate"
                              dangerouslySetInnerHTML={{
                                __html: prod._formatted?.title || prod.title,
                              }}
                            />
                            <p className="text-[10px] text-slate-400 capitalize">
                              {prod.categoryName || prod.category}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-xs flex-shrink-0">
                          {formatPrice(prod.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Zero Results */}
              {!isSearching && searchQuery.trim() && searchHits.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-xs font-bold text-slate-700">
                    No matches found for "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Check spelling or browse generic categories below.
                  </p>
                </div>
              )}

              {recentSearches.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recent Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleSuggestionClick(term);
                          setIsMobileSearchOpen(false);
                        }}
                        className="px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 font-medium flex items-center gap-1.5 min-h-[36px]"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Popular Categories
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        onNavigate('plp', { category: c.id });
                      }}
                      className="p-3 bg-slate-50 hover:bg-primary-50 rounded-xl text-left border border-slate-200 font-bold text-slate-800"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
