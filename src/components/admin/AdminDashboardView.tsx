import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Star,
  TicketPercent,
  CheckCircle2,
  Calendar,
  ChevronRight,
  RefreshCw,
  Radio,
  Users,
  Eye,
  Globe,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminApi, AdminOrder } from '../../lib/adminApi';
import { PRODUCTS } from '../../data/products';
import { formatPrice } from '../../lib/utils';
import { AdminTab } from './AdminLayout';
import {
  subscribeLiveVisitors,
  getHistoricalVisitStats,
  HistoricalVisitStats,
} from '../../lib/visitorTracker';

interface AdminDashboardViewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateTab }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerCount, setCustomerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [liveVisitorsCount, setLiveVisitorsCount] = useState<number>(1);
  const [livePaths, setLivePaths] = useState<string[]>([]);
  const [visitStats, setVisitStats] = useState<HistoricalVisitStats>({
    today: { pageViews: 0, uniqueVisitors: 0 },
    thisWeek: { pageViews: 0, uniqueVisitors: 0 },
    thisMonth: { pageViews: 0, uniqueVisitors: 0 },
    topPages: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, productList, customerList, stats] = await Promise.all([
        adminApi.getOrders(),
        adminApi.getProducts(),
        adminApi.getCustomers(),
        getHistoricalVisitStats(),
      ]);
      setOrders(orderList || []);
      setProducts(productList || []);
      setCustomerCount(customerList?.length || 0);
      setVisitStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to Supabase Realtime Presence channel for live visitor tracking (zero polling)
    const unsubscribe = subscribeLiveVisitors((count, paths) => {
      setLiveVisitorsCount(count);
      setLivePaths(paths);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time metrics calculations (Directly computed from Supabase tables)
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.pricing?.total) || 0), 0);
  
  const todayOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const pendingShipments = orders.filter(
    (o) => !o.estimatedDeliveryDate || o.orderStatus === 'delivery_date_pending'
  ).length;

  const lowStockCount = products.filter((p) => Number(p.stockCount ?? p.stock ?? 0) < 10).length;

  // Chart data: Group REAL orders by calendar day for 7d or 30d
  const daysCount = timeRange === '7d' ? 7 : 30;
  const chartData = Array.from({ length: daysCount }).map((_, idx) => {
    const day = new Date();
    day.setDate(day.getDate() - (daysCount - 1 - idx));
    const label = day.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: daysCount > 10 ? 'numeric' : 'short',
    });

    const dayOrders = orders.filter((o) => {
      if (!o.createdAt) return false;
      const od = new Date(o.createdAt);
      return od.toDateString() === day.toDateString();
    });

    const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.pricing?.total) || 0), 0);
    const dayCount = dayOrders.length;

    return {
      date: label,
      revenue: dayRevenue,
      orders: dayCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Refresh bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-slate-500">
            Real-time telemetry and order dispatch activity for HodaHub store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* 0. REAL-TIME VISITOR TRACKING & TELEMETRY (Supabase Realtime Presence) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Live Visitors Right Now */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-sm shadow-emerald-400/50" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Supabase Realtime Presence
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {liveVisitorsCount}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-200">
                people browsing right now
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-md">
              Instant live session tracking across HodaHub storefront. Realtime Presence registers active tabs and auto-drops sessions when users close windows with 0 polling.
            </p>

            {/* Active Browsing Paths Pill Preview */}
            {livePaths.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Active routes:</span>
                {Array.from(new Set(livePaths)).slice(0, 4).map((path, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800/80 text-emerald-300 border border-slate-700"
                  >
                    {path}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Historical Visits Summary (Today, This Week, This Month) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-shrink-0">
            {/* Today */}
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-4 border border-slate-700/80 min-w-[150px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                <span>Today</span>
                <Eye className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <div className="text-xl font-black font-mono text-white">
                {visitStats.today.pageViews.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Pageviews</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {visitStats.today.uniqueVisitors.toLocaleString()} unique
                </span>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-4 border border-slate-700/80 min-w-[150px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                <span>This Week</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-black font-mono text-white">
                {visitStats.thisWeek.pageViews.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Pageviews</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {visitStats.thisWeek.uniqueVisitors.toLocaleString()} unique
                </span>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-4 border border-slate-700/80 min-w-[150px]">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                <span>This Month</span>
                <Globe className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-black font-mono text-white">
                {visitStats.thisMonth.pageViews.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Pageviews</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {visitStats.thisMonth.uniqueVisitors.toLocaleString()} unique
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. KEY PERFORMANCE INDICATORS (KPIs) - Live Telemetry from Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* KPI 1: Today's Orders */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-primary-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Today's Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {todayOrders}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium truncate">
            {orders.length} total store orders
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-primary-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatPrice(totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium truncate">
            {orders.filter((o) => o.paymentStatus === 'completed').length} paid transactions
          </div>
        </div>

        {/* KPI 3: Pending Shipments */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-amber-900">
              Pending Shipments
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">
            {pendingShipments}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
            <span>Awaiting dispatch</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 4: Low-Stock Alerts */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white border border-rose-200/80 rounded-xl p-4 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-rose-900">
              Low-Stock Alerts
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950 font-mono">
            {lowStockCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-rose-700 font-medium">
            <span>SKUs &lt; 10 units</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 5: Active Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-indigo-900">
              Catalog Items
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 font-mono">
            {products.length}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-indigo-700 font-medium">
            <span>Active SKUs in store</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* KPI 6: Registered Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-purple-900">
              Customers
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono">
            {customerCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-700 font-medium">
            <span>Verified accounts</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 2. SALES ANALYTICS CHART (RECHARTS) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Revenue & Order Trajectory</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Live Supabase Feed
              </span>
            </h3>
            <p className="text-xs text-slate-500">Gross merchandizing value across HodaHub fulfillment</p>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="hodaRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 font-sans border border-slate-800">
                        <div className="font-bold text-slate-300 font-mono">{label}</div>
                        <div className="text-primary-400 font-mono text-sm font-bold">
                          {formatPrice(data.revenue)}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {data.orders} orders processed
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#hodaRevenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. RECENT ORDERS TABLE & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Latest Customer Orders</h3>
              <p className="text-xs text-slate-500">Live stream of transactions placed on HodaHub</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => {
                  const isPending =
                    !order.estimatedDeliveryDate ||
                    order.orderStatus === 'delivery_date_pending';

                  return (
                    <tr
                      key={order._id}
                      onClick={() => onNavigateTab('orders')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {order.shippingAddress?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {order.shippingAddress?.city || 'India'}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatPrice(order.pricing?.total || 0)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            order.orderStatus === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        {order.estimatedDeliveryDate ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {order.estimatedDeliveryDate}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Not set</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operational Actions (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Admin Quick Actions</h3>
          <p className="text-xs text-slate-500">Fast shortcuts for daily operational tasks</p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-primary-600">
                    Add New Product
                  </div>
                  <div className="text-[11px] text-slate-500">Upload to Cloudinary catalog</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('orders')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                    Assign Delivery Dates
                  </div>
                  <div className="text-[11px] text-slate-500">{pendingShipments} pending dispatch</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('reviews')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-yellow-500 hover:bg-yellow-50/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-yellow-700">
                    Moderate Customer Reviews
                  </div>
                  <div className="text-[11px] text-slate-500">Verify genuine purchases</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('coupons')}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    Create Promo Coupon
                  </div>
                  <div className="text-[11px] text-slate-500">Discount codes & campaigns</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
