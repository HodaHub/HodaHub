import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FlyingCartItem } from './components/common/FlyingCartItem';
import { AuthModal } from './components/auth/AuthModal';

// Core pages (loaded upfront for instant interactivity)
import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';

// Lazy loaded secondary & static pages for optimal Core Web Vitals and code-splitting
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));

// Admin Pages and Views (Lazy loaded)
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardView = lazy(() => import('./components/admin/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView })));
const AdminProductsView = lazy(() => import('./components/admin/AdminProductsView').then((m) => ({ default: m.AdminProductsView })));
const AdminCategoriesView = lazy(() => import('./components/admin/AdminCategoriesView').then((m) => ({ default: m.AdminCategoriesView })));
const AdminBannersView = lazy(() => import('./components/admin/AdminBannersView').then((m) => ({ default: m.AdminBannersView })));
const AdminOrdersView = lazy(() => import('./components/admin/AdminOrdersView').then((m) => ({ default: m.AdminOrdersView })));
const AdminReviewsView = lazy(() => import('./components/admin/AdminReviewsView').then((m) => ({ default: m.AdminReviewsView })));
const AdminCouponsView = lazy(() => import('./components/admin/AdminCouponsView').then((m) => ({ default: m.AdminCouponsView })));
const AdminCustomersView = lazy(() => import('./components/admin/AdminCustomersView').then((m) => ({ default: m.AdminCustomersView })));
const AdminSettingsView = lazy(() => import('./components/admin/AdminSettingsView').then((m) => ({ default: m.AdminSettingsView })));
const AdminBoxOptionsView = lazy(() => import('./components/admin/AdminBoxOptionsView').then((m) => ({ default: m.AdminBoxOptionsView })));

// Content Pages (Lazy loaded)
const ContactUsPage = lazy(() => import('./pages/content/ContactUsPage').then((m) => ({ default: m.ContactUsPage })));
const AboutUsPage = lazy(() => import('./pages/content/AboutUsPage').then((m) => ({ default: m.AboutUsPage })));
const CareersPage = lazy(() => import('./pages/content/CareersPage').then((m) => ({ default: m.CareersPage })));
const HodaHubStoriesPage = lazy(() => import('./pages/content/HodaHubStoriesPage').then((m) => ({ default: m.HodaHubStoriesPage })));
const PressMediaPage = lazy(() => import('./pages/content/PressMediaPage').then((m) => ({ default: m.PressMediaPage })));
const CorporateInfoPage = lazy(() => import('./pages/content/CorporateInfoPage').then((m) => ({ default: m.CorporateInfoPage })));
const PaymentsInfoPage = lazy(() => import('./pages/content/PaymentsInfoPage').then((m) => ({ default: m.PaymentsInfoPage })));
const ShippingPincodesPage = lazy(() => import('./pages/content/ShippingPincodesPage').then((m) => ({ default: m.ShippingPincodesPage })));
const CancellationReturnsPage = lazy(() => import('./pages/content/CancellationReturnsPage').then((m) => ({ default: m.CancellationReturnsPage })));
const FaqPage = lazy(() => import('./pages/content/FaqPage').then((m) => ({ default: m.FaqPage })));
const ReportInfringementPage = lazy(() => import('./pages/content/ReportInfringementPage').then((m) => ({ default: m.ReportInfringementPage })));
const TermsOfUsePage = lazy(() => import('./pages/content/TermsOfUsePage').then((m) => ({ default: m.TermsOfUsePage })));
const SecurityPage = lazy(() => import('./pages/content/SecurityPage').then((m) => ({ default: m.SecurityPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/content/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const SitemapPage = lazy(() => import('./pages/content/SitemapPage').then((m) => ({ default: m.SitemapPage })));
const GrievanceRedressalPage = lazy(() => import('./pages/content/GrievanceRedressalPage').then((m) => ({ default: m.GrievanceRedressalPage })));

import { PRODUCTS } from './data/products';
import { Product } from './types';
import { useFilterStore } from './store/useFilterStore';
import { useAuthStore } from './store/useAuthStore';
import { useAdminAuthStore } from './store/useAdminAuthStore';
import { AdminTab } from './components/admin/AdminLayout';
import { getProductSlug, findProductBySlug, getCategorySlug, findCategoryBySlug } from './lib/slugs';
import { joinVisitorPresence, logPageView } from './lib/visitorTracker';

// Lightweight accessible loading fallback for lazy-loaded route bundles
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full" role="status" aria-label="Loading page content">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
      <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const setCategoryFilter = useFilterStore((state) => state.setCategory);
  const { isAuthenticated, openAuthModal } = useAuthStore();

  // 1. Realtime Presence Visitor Tracking (Joins site-visitors channel)
  useEffect(() => {
    joinVisitorPresence(window.location.pathname);
  }, []);

  // 2. Historical Pageviews Tracking (Lightweight insert on route transition)
  useEffect(() => {
    const currentPath = window.location.pathname || '/';
    logPageView(currentPath, useAuthStore.getState().user?._id);
  }, [currentPage, pageParams, adminTab]);

  // URL Path detection on initial mount & back/forward navigation
  useEffect(() => {
    const syncFromLocation = () => {
      const pathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const searchQuery = searchParams.get('q') || searchParams.get('search');

      // 0. Admin Login route: /admin/login
      if (pathname === '/admin/login') {
        setCurrentPage('admin-login');
        return;
      }

      // 0.1 Customer Account route: /account (Protected — OTP-logged-in users only)
      if (pathname === '/account') {
        const hasAuth = useAuthStore.getState().isAuthenticated;
        if (!hasAuth) {
          useAuthStore.getState().openAuthModal('/account');
          setCurrentPage('home');
          return;
        }
        const tab = searchParams.get('tab');
        if (tab) {
          setPageParams({ tab });
        }
        setCurrentPage('account');
        return;
      }

      // 1. Admin Portal routes: /admin, /admin/* or /admin-orders
      if (pathname.startsWith('/admin') || pathname === '/admin-orders') {
        const hasAdminAuth = useAdminAuthStore.getState().checkAuth();
        if (!hasAdminAuth) {
          window.history.replaceState(null, '', '/admin/login');
          setCurrentPage('admin-login');
          return;
        }

        let tab: AdminTab = 'dashboard';
        if (pathname === '/admin/orders' || pathname === '/admin-orders') tab = 'orders';
        else if (pathname === '/admin/products') tab = 'products';
        else if (pathname === '/admin/categories') tab = 'categories';
        else if (pathname === '/admin/banners') tab = 'banners';
        else if (pathname === '/admin/reviews') tab = 'reviews';
        else if (pathname === '/admin/coupons') tab = 'coupons';
        else if (pathname === '/admin/customers') tab = 'customers';
        else if (pathname === '/admin/boxes') tab = 'boxes';
        else if (pathname === '/admin/settings') tab = 'settings';
        else if (pathname === '/admin/dashboard' || pathname === '/admin') tab = 'dashboard';

        setAdminTab(tab);
        setCurrentPage('admin');
        return;
      }

      // 2. Product PDP route: /product/:slug
      if (pathname.startsWith('/product/')) {
        const slug = decodeURIComponent(pathname.replace(/^\/product\//, '').replace(/\/$/, ''));
        const product = findProductBySlug(slug);
        if (product) {
          setSelectedProduct(product);
          setCurrentPage('pdp');
          return;
        }
      }

      // 3. Category PLP route: /category/:categorySlug
      if (pathname.startsWith('/category/')) {
        const catSlug = decodeURIComponent(pathname.replace(/^\/category\//, '').replace(/\/$/, ''));
        const cat = findCategoryBySlug(catSlug);
        if (cat) {
          setCategoryFilter(cat.id);
          setPageParams({ category: cat.id });
          setCurrentPage('plp');
          return;
        }
      }

      // 4. Search query route: /search?q=...
      if (pathname === '/search' || searchQuery) {
        if (searchQuery) {
          setPageParams({ search: searchQuery });
        }
        setCurrentPage('plp');
        return;
      }

      // 5. Clean path match
      const path = pathname.replace(/^\//, '').replace(/\/$/, '') || 'home';
      const validPages = [
        'home', 'account', 'plp', 'cart', 'checkout', 'wishlist', 'orders',
        'contact-us', 'about-us', 'careers', 'hodahub-stories', 'press-media',
        'corporate-information', 'payments-info', 'shipping-pincodes', 'cancellation-returns',
        'faq', 'report-infringement', 'terms-of-use', 'security', 'privacy-policy',
        'sitemap', 'grievance-redressal', 'track-order'
      ];

      if (validPages.includes(path)) {
        setCurrentPage(path);
      } else {
        setCurrentPage('home');
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [setCategoryFilter]);

  // Scroll to top on page transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, selectedProduct]);

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    // 1. Admin login direct request
    if (page === 'admin-login') {
      setCurrentPage('admin-login');
      if (window.location.pathname !== '/admin/login') {
        window.history.pushState(null, '', '/admin/login');
      }
      return;
    }

    // 2. Admin portal navigation
    if (page === 'admin' || page === 'admin-orders') {
      const hasAdminAuth = useAdminAuthStore.getState().checkAuth();
      if (!hasAdminAuth) {
        setCurrentPage('admin-login');
        window.history.pushState(null, '', '/admin/login');
        return;
      }

      const targetTab = page === 'admin-orders' ? 'orders' : (params?.tab as AdminTab) || 'dashboard';
      setAdminTab(targetTab);
      setCurrentPage('admin');
      const targetUrl = `/admin/${targetTab}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState(null, '', targetUrl);
      }
      return;
    }

    // 3. Customer protected routes check (account, orders & wishlist require customer OTP auth)
    const protectedCustomerPages = ['account', 'orders', 'wishlist'];
    if (protectedCustomerPages.includes(page) && !isAuthenticated) {
      setPendingRoute(page);
      openAuthModal();
      return;
    }

    let urlPath = `/${page}`;

    if (page === 'home') {
      urlPath = '/';
    } else if (page === 'account') {
      urlPath = params?.tab ? `/account?tab=${params.tab}` : '/account';
    } else if (page === 'pdp') {
      if (params.productId) {
        const found = PRODUCTS.find((p) => p.id === params.productId);
        if (found) {
          setSelectedProduct(found);
          urlPath = `/product/${getProductSlug(found)}`;
        }
      } else if (selectedProduct) {
        urlPath = `/product/${getProductSlug(selectedProduct)}`;
      }
    } else if (page === 'plp') {
      if (params.category) {
        setCategoryFilter(params.category);
        urlPath = `/category/${getCategorySlug(params.category)}`;
      } else if (params.search) {
        urlPath = `/search?q=${encodeURIComponent(params.search)}`;
      } else if (params.tag) {
        urlPath = `/plp?tag=${encodeURIComponent(params.tag)}`;
      }
    }

    if (params.productId && page !== 'pdp') {
      const found = PRODUCTS.find((p) => p.id === params.productId);
      if (found) {
        setSelectedProduct(found);
      }
    }
    if (params.category && page !== 'plp') {
      setCategoryFilter(params.category);
    }

    setPageParams(params);
    setCurrentPage(page);

    // Sync browser URL
    if (window.location.pathname !== urlPath) {
      window.history.pushState(null, '', urlPath);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('pdp');
    const slug = getProductSlug(product);
    window.history.pushState(null, '', `/product/${slug}`);
  };

  const handleAuthSuccess = () => {
    if (pendingRoute) {
      setCurrentPage(pendingRoute);
      window.history.pushState(null, '', `/${pendingRoute}`);
      setPendingRoute(null);
    }
  };

  const handleSelectAdminTab = (tab: AdminTab) => {
    setAdminTab(tab);
    window.history.pushState(null, '', `/admin/${tab}`);
  };

  // Dedicated Admin Login View (Isolated from customer storefront)
  if (currentPage === 'admin-login') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminLoginPage
          onLoginSuccess={() => {
            setAdminTab('dashboard');
            setCurrentPage('admin');
            window.history.pushState(null, '', '/admin/dashboard');
          }}
          onNavigateStorefront={() => handleNavigate('home')}
        />
      </Suspense>
    );
  }

  // Dedicated Admin Operations Hub (Isolated from customer storefront Header/Footer)
  if (currentPage === 'admin') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <AdminLayout
          activeTab={adminTab}
          onSelectTab={handleSelectAdminTab}
          onNavigateStorefront={() => handleNavigate('home')}
        >
          {adminTab === 'dashboard' && <AdminDashboardView onNavigateTab={handleSelectAdminTab} />}
          {adminTab === 'products' && <AdminProductsView />}
          {adminTab === 'categories' && <AdminCategoriesView />}
          {adminTab === 'banners' && <AdminBannersView />}
          {adminTab === 'boxes' && <AdminBoxOptionsView />}
          {adminTab === 'orders' && <AdminOrdersView />}
          {adminTab === 'reviews' && <AdminReviewsView />}
          {adminTab === 'coupons' && <AdminCouponsView />}
          {adminTab === 'customers' && <AdminCustomersView />}
          {adminTab === 'settings' && <AdminSettingsView />}
        </AdminLayout>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-700 w-full max-w-full overflow-x-hidden">
      {/* Global Flying Cart Particle Animation Layer */}
      <FlyingCartItem />

      {/* Global Mobile + OTP Auth Modal */}
      <AuthModal onSuccess={handleAuthSuccess} />

      {/* Sticky Header with Search, Category Rail & Cart Bounce */}
      <Header onNavigate={handleNavigate} activePage={currentPage} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 pt-3 sm:pt-4 min-w-0">
        <Suspense fallback={<RouteLoadingFallback />}>
          <AnimatePresence mode="wait">
          {/* 1. Core Shopping Pages */}
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HomePage onSelectProduct={handleSelectProduct} onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'plp' && (
            <motion.div
              key="plp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ProductListingPage
                onSelectProduct={handleSelectProduct}
                onNavigate={handleNavigate}
                initialCategory={pageParams.category}
                initialSearch={pageParams.search}
                initialTag={pageParams.tag}
              />
            </motion.div>
          )}

          {currentPage === 'pdp' && (
            <motion.div
              key={`pdp-${selectedProduct.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ProductDetailPage
                product={selectedProduct}
                onNavigate={handleNavigate}
                onSelectProduct={handleSelectProduct}
              />
            </motion.div>
          )}

          {currentPage === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CartPage onNavigate={handleNavigate} onSelectProduct={handleSelectProduct} />
            </motion.div>
          )}

          {currentPage === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CheckoutPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WishlistPage onNavigate={handleNavigate} onSelectProduct={handleSelectProduct} />
            </motion.div>
          )}

          {currentPage === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <OrdersPage onNavigate={handleNavigate} onSelectProduct={handleSelectProduct} />
            </motion.div>
          )}

          {currentPage === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AccountPage
                onNavigate={handleNavigate}
                onSelectProduct={handleSelectProduct}
                initialTab={pageParams.tab}
              />
            </motion.div>
          )}

          {/* 2. All 16 Footer-Linked Pages (GAP 3 Requirement) */}
          {currentPage === 'contact-us' && (
            <motion.div key="contact-us" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ContactUsPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'about-us' && (
            <motion.div key="about-us" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AboutUsPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'careers' && (
            <motion.div key="careers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CareersPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'hodahub-stories' && (
            <motion.div key="hodahub-stories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HodaHubStoriesPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'press-media' && (
            <motion.div key="press-media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PressMediaPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'corporate-information' && (
            <motion.div key="corporate-information" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CorporateInfoPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'payments-info' && (
            <motion.div key="payments-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentsInfoPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'shipping-pincodes' && (
            <motion.div key="shipping-pincodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ShippingPincodesPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'cancellation-returns' && (
            <motion.div key="cancellation-returns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CancellationReturnsPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FaqPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'report-infringement' && (
            <motion.div key="report-infringement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReportInfringementPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'terms-of-use' && (
            <motion.div key="terms-of-use" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TermsOfUsePage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SecurityPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'privacy-policy' && (
            <motion.div key="privacy-policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PrivacyPolicyPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'sitemap' && (
            <motion.div key="sitemap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SitemapPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'grievance-redressal' && (
            <motion.div key="grievance-redressal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GrievanceRedressalPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === 'track-order' && (
            <motion.div key="track-order" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TrackOrderPage onNavigate={handleNavigate} />
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      {/* Comprehensive E-Commerce Footer With All 16 Built Routes */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
