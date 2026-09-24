import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { Product } from '../types';
import { SEO } from '../components/common/SEO';
import { ProfileTab } from '../components/account/ProfileTab';
import { OrdersTab } from '../components/account/OrdersTab';
import { AddressesTab } from '../components/account/AddressesTab';
import { WishlistTab } from '../components/account/WishlistTab';

export type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist';

interface AccountPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct?: (product: Product) => void;
  initialTab?: AccountTab;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  onNavigate,
  onSelectProduct,
  initialTab = 'profile',
}) => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((state) => state.items.length);

  // Sync tab with initial prop or URL param
  const [activeTab, setActiveTab] = useState<AccountTab>(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as AccountTab;
      if (tabParam && ['profile', 'orders', 'addresses', 'wishlist'].includes(tabParam)) {
        return tabParam;
      }
    } catch {
      // ignore
    }
    return initialTab;
  });

  // Guard: If unauthenticated visitor arrives at /account, redirect home
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('home');
    }
  }, [isAuthenticated, onNavigate]);

  // Tab switcher
  const handleSelectTab = (tab: AccountTab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `/account?tab=${tab}`);
  };

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  if (!isAuthenticated) {
    return null;
  }

  const tabs: Array<{ id: AccountTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }> = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, badge: wishlistCount },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl w-full mx-auto">
      <SEO
        title="My Account | HodaHub"
        description="Manage your verified HodaHub profile, delivery addresses, order tracking, and wishlist."
        canonicalUrl="https://hodahub.in/account"
        noindex={true}
      />

      {/* Mobile Header Greeting */}
      <div className="md:hidden bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center font-mono text-sm shadow-sm">
            {user?.name?.[0] || 'O'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm leading-snug">
              {user?.name || 'HodaHub Shopper'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {user?.phone}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Responsive Navigation: Horizontal Scrollable Segmented Bar */}
      <div className="md:hidden overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max bg-slate-100 p-1.5 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-primary-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-primary-100 text-primary-700 text-[10px] rounded-full font-mono font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout: Fixed Sidebar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* User Profile Card */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center font-mono text-base shadow-sm">
                {user?.name?.[0] || 'O'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-900 text-sm line-clamp-1">
                  {user?.name || 'HodaHub Shopper'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {user?.phone}
                </div>
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 ? (
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-full font-mono font-bold">
                      {tab.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : 'text-slate-300'}`} />
                  )}
                </button>
              );
            })}

            {/* Logout Action */}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of HodaHub</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="md:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'orders' && (
            <OrdersTab onNavigate={onNavigate} onSelectProduct={onSelectProduct} />
          )}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'wishlist' && (
            <WishlistTab onNavigate={onNavigate} onSelectProduct={onSelectProduct} />
          )}
        </main>
      </div>
    </div>
  );
};
