import React from 'react';
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
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';
import { SEO } from '../common/SEO';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'banners'
  | 'orders'
  | 'reviews'
  | 'coupons'
  | 'customers'
  | 'boxes'
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const { adminUser, logout } = useAdminAuthStore();

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
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
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased">
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* 1. FIXED LEFT SIDEBAR (Desktop permanent + Mobile slide-over) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-600/30">
              <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-white tracking-tight text-sm">Hoda</span>
                <span className="font-black text-primary-400 tracking-tight text-sm">Hub</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 -mt-0.5">
                Admin Console
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Return to Storefront */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
          <button
            onClick={onNavigateStorefront}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            title="Open customer-facing website"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>HodaHub Store</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              Live
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER (Offset by sidebar width on lg) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                HodaHub Operations / {activeTitle}
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {activeTitle}
              </h1>
            </div>
          </div>

          {/* Right Top Bar Controls */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            {/* Live Service Health Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-800 px-2.5 py-1 rounded-full font-mono text-[11px] font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>API Online</span>
            </div>

            {/* Admin User Info Pill */}
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                {adminUser?.name?.[0] || 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-slate-900 line-clamp-1 leading-snug">
                  {adminUser?.name || 'HodaHub Admin'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                  {adminUser?.email || 'admin@hodahub.com'}
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign out of Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
