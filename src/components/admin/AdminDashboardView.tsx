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
  MessageSquare,
  Send,
  ShieldCheck,
  Check,
  ExternalLink,
  Sparkles,
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
import { formatPrice } from '../../lib/utils';
import { AdminTab } from './AdminLayout';
import {
  subscribeLiveVisitors,
  getHistoricalVisitStats,
  HistoricalVisitStats,
} from '../../lib/visitorTracker';
import {
  checkWhatsAppGateway,
  sendWhatsAppOtp,
  WhatsAppGatewayStatus,
} from '../../lib/whatsappOtp';

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

  // WhatsApp Gateway State
  const [waStatus, setWaStatus] = useState<WhatsAppGatewayStatus>({
    isConnected: false,
    hasQr: false,
  });
  const [testPhone, setTestPhone] = useState('');
  const [testingOtp, setTestingOtp] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, productList, customerList, stats, wa] = await Promise.all([
        adminApi.getOrders(),
        adminApi.getProducts(),
        adminApi.getCustomers(),
        getHistoricalVisitStats(),
        checkWhatsAppGateway(),
      ]);
      setOrders(orderList || []);
      setProducts(productList || []);
      setCustomerCount(customerList?.length || 0);
      setVisitStats(stats);
      setWaStatus(wa);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live visitor tracking
    const unsubscribe = subscribeLiveVisitors((count, paths) => {
      setLiveVisitorsCount(count);
      setLivePaths(paths);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendTestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setOtpFeedback({ success: false, msg: 'Please enter a valid 10-digit number.' });
      return;
    }

    setTestingOtp(true);
    setOtpFeedback(null);
    try {
      const res = await sendWhatsAppOtp(clean);
      if (res.success) {
        setOtpFeedback({ success: true, msg: `OTP sent to +91 ${clean}! Check WhatsApp.` });
      } else {
        setOtpFeedback({ success: false, msg: res.error || 'Failed to dispatch OTP' });
      }
    } catch (err: any) {
      setOtpFeedback({ success: false, msg: err.message || 'Error communicating with gateway' });
    } finally {
      setTestingOtp(false);
    }
  };

  // Metrics
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

  // Chart data
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
    <div className="space-y-5">
      {/* 1. MINIMAL HEADER & REFRESH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-xs text-slate-500">
            Real-time store metrics, fulfillment pipeline, and messaging gateway.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME ACTIVITY & WHATSAPP GATEWAY (Minimal, Cohesive 2-Card Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Real-time Visitor Telemetry (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-900">Live Traffic Telemetry</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Instant Session Tracker
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
            <div>
              <div className="text-[11px] font-medium text-slate-400">Active Now</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {liveVisitorsCount}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">browsing store</div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400">Today's Views</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {visitStats.today.pageViews.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {visitStats.today.uniqueVisitors.toLocaleString()} unique
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400">This Week</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {visitStats.thisWeek.pageViews.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {visitStats.thisWeek.uniqueVisitors.toLocaleString()} unique
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-400">This Month</div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {visitStats.thisMonth.pageViews.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {visitStats.thisMonth.uniqueVisitors.toLocaleString()} unique
              </div>
            </div>
          </div>

          {livePaths.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Active:</span>
              {Array.from(new Set(livePaths)).slice(0, 4).map((path, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700"
                >
                  {path}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Gateway Status & Test Tool (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-900">WhatsApp OTP Gateway</span>
              </div>
              {waStatus.isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Disconnected
                </span>
              )}
            </div>

            <div className="py-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Linked Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {waStatus.userPhone ? `+${waStatus.userPhone}` : 'No phone linked'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Session Status:</span>
                <span className="text-slate-700 font-medium">
                  {waStatus.isConnected ? 'Persistent (No QR needed)' : 'Needs Start / QR'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-snug">
                Once paired, WhatsApp keeps the session permanently stored in <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-600">.whatsapp_session</code>. You do not need to scan again.
              </p>
            </div>
          </div>

          {/* Quick OTP Test Tool */}
          <form onSubmit={handleSendTestOtp} className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-semibold text-slate-700">Test WhatsApp Delivery:</div>
            <div className="flex gap-1.5">
              <input
                type="tel"
                placeholder="10-digit phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                maxLength={10}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={testingOtp || !waStatus.isConnected}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                {testingOtp ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Send</span>
              </button>
            </div>
            {otpFeedback && (
              <div
                className={`text-[11px] font-medium ${
                  otpFeedback.success ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {otpFeedback.msg}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 3. MINIMAL UNIFIED KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Today's Orders */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Today's Orders</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {todayOrders}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">{orders.length} total</div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Gross Revenue</div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {formatPrice(totalRevenue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {orders.filter((o) => o.paymentStatus === 'completed').length} paid
          </div>
        </div>

        {/* KPI 3: Pending Dispatch */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:border-slate-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Pending Dispatch</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono mt-1">
            {pendingShipments}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-1">needs delivery date</div>
        </div>

        {/* KPI 4: Low Stock */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:border-slate-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Low Stock SKUs</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-black text-rose-600 font-mono mt-1">
            {lowStockCount}
          </div>
          <div className="text-[10px] text-rose-700/80 mt-1">&lt; 10 units in stock</div>
        </div>

        {/* KPI 5: Active Catalog */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:border-slate-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Products</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {products.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">active in catalog</div>
        </div>

        {/* KPI 6: Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:border-slate-400 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Customers</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {customerCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">registered accounts</div>
        </div>
      </div>

      {/* 4. REVENUE TRAJECTORY CHART (Clean Minimal Recharts) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Revenue & Order Volume</h3>
            <p className="text-[11px] text-slate-400">Fulfillment settlement trajectory</p>
          </div>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cleanRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                stroke="#94a3b8"
                fontSize={10}
                tickMargin={6}
              />
              <YAxis
                tickLine={false}
                stroke="#94a3b8"
                fontSize={10}
                tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs space-y-0.5 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">{label}</div>
                        <div className="font-mono font-bold text-white text-sm">
                          {formatPrice(data.revenue)}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {data.orders} orders placed
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
                stroke="#0f172a"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cleanRevenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. LATEST ORDERS & QUICK SHORTCUTS (Minimal Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders List (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Recent Orders</h3>
              <p className="text-[11px] text-slate-400">Latest customer transactions</p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>All orders</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-mono uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2 px-2">Order ID</th>
                  <th className="py-2 px-2">Customer</th>
                  <th className="py-2 px-2">Amount</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Delivery Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((order) => {
                    const isPending =
                      !order.estimatedDeliveryDate ||
                      order.orderStatus === 'delivery_date_pending';

                    return (
                      <tr
                        key={order._id}
                        onClick={() => onNavigateTab('orders')}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-2 font-mono font-semibold text-slate-900">
                          {order.orderId}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-slate-800">
                            {order.shippingAddress?.name || 'Customer'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {order.shippingAddress?.city || 'India'}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-semibold text-slate-900">
                          {formatPrice(order.pricing?.total || 0)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                              order.orderStatus === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : isPending
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600 text-right">
                          {order.estimatedDeliveryDate ? (
                            <span className="text-slate-800 font-medium">
                              {order.estimatedDeliveryDate}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">Not set</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Operations</h3>
            <p className="text-[11px] text-slate-400">Common administrative actions</p>
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Manage Catalog</div>
                  <div className="text-[10px] text-slate-400">Add or edit products & inventory</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('scraper')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Auto Product Scraper</div>
                  <div className="text-[10px] text-slate-400">Scrape sites & sync directly to catalog</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('orders')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Fulfill Orders</div>
                  <div className="text-[10px] text-slate-400">{pendingShipments} awaiting dispatch</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('coupons')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <TicketPercent className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Promo Coupons</div>
                  <div className="text-[10px] text-slate-400">Manage customer discounts</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('settings')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-400 hover:bg-slate-50 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">WhatsApp & API Settings</div>
                  <div className="text-[10px] text-slate-400">Gateway configuration & health</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
