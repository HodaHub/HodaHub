import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  TicketPercent,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Activity,
  Menu,
  X,
  Gift,
  FolderTree,
  Sliders,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';
import { SEO } from '../common/SEO';
import { checkWhatsAppGateway, WhatsAppGatewayStatus } from '../../lib/whatsappOtp';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'scraper'
  | 'categories'
  | 'banners'
  | 'boxes'
  | 'orders'
  | 'reviews'
  | 'coupons'
  | 'customers'
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onNavigateStorefront: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  onNavigateStorefront,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { adminUser, logout } = useAdminAuthStore();
  const [waStatus, setWaStatus] = useState<WhatsAppGatewayStatus>({
    isConnected: false,
    hasQr: false,
  });

  useEffect(() => {
    let isMounted = true;
    const updateWaStatus = async () => {
      const status = await checkWhatsAppGateway();
      if (isMounted) setWaStatus(status);
    };

    updateWaStatus();
    const interval = setInterval(updateWaStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'scraper', label: 'Auto Scraper', icon: Sparkles },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'banners', label: 'Banners', icon: Sliders },
    { id: 'boxes', label: 'Box Options', icon: Gift },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'coupons', label: 'Coupons', icon: TicketPercent },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setMobileSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  const activeTitle = navItems.find((n) => n.id === activeTab)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col antialiased">
      <SEO
        title={`${activeTitle} | HodaHub Admin Operations`}
        description="HodaHub administrative operations control center."
        canonicalUrl={`https://hodahub.in/admin/${activeTab}`}
        noindex={true}
      />

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 1. FIXED LEFT SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white text-slate-700 flex flex-col border-r border-slate-200/80 transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-1 font-bold text-slate-900 text-sm tracking-tight">
                <span>HodaHub</span>
                <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1 py-0.2 rounded">HQ</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Return to Storefront */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onNavigateStorefront}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/60 transition-all cursor-pointer shadow-none hover:shadow-xs"
            title="Open customer-facing website"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Live Storefront</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="lg:pl-60 flex flex-col flex-1 min-h-screen">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Admin</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 text-sm">{activeTitle}</span>
            </div>
          </div>

          {/* Right Top Bar Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
            {/* WhatsApp Gateway Status Pill */}
            {waStatus.isConnected ? (
              <div
                title={`WhatsApp OTP Gateway Connected as +${waStatus.userPhone || 'Linked'}. Session saved & active.`}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>WA: +{waStatus.userPhone ? waStatus.userPhone.slice(-10) : 'Online'}</span>
              </div>
            ) : (
              <button
                onClick={() => onSelectTab('settings')}
                title="WhatsApp Gateway server offline or needs attention. Click to configure."
                className="hidden sm:flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>WA Offline</span>
              </button>
            )}

            {/* API Health Pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 text-slate-600 px-2.5 py-1 rounded-full font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>API Ready</span>
            </div>

            {/* Admin User Info Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-semibold text-[11px] flex items-center justify-center font-mono">
                {adminUser?.name?.[0] || 'A'}
              </div>
              <span className="hidden md:inline font-medium text-slate-800 text-xs">
                {adminUser?.name || 'Administrator'}
              </span>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Sign out of Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
          {children}
        </main>
      </div>
    </div>
  );
};
