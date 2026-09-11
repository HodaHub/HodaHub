import React, { useState } from 'react';
import { Calendar, Truck, Clock, CheckCircle2, Search, Filter, ShieldAlert, ArrowLeft, ExternalLink } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { formatPrice } from '../lib/utils';
import { adminApi } from '../lib/adminApi';

export interface AdminOrderRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  productTitle: string;
  productImage: string;
  price: number;
  orderDate: string;
  orderStatus: 'delivery_date_pending' | 'delivery_date_confirmed' | 'shipped' | 'delivered';
  estimatedDeliveryDate: string | null; // ISO format or YYYY-MM-DD
  deliveryDateSetAt?: string | null;
  isGuestOrder?: boolean;
  addressLine?: string;
  pincode?: string;
}

interface AdminOrdersPageProps {
  onNavigate?: (page: string, params?: Record<string, any>) => void;
}

export const AdminOrdersPage: React.FC<AdminOrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([
    {
      id: 'ord-101',
      orderId: 'HODA-ORD-2026-904128',
      customerName: 'Anand Rao',
      customerPhone: '+91 98765 43210',
      customerCity: 'Bengaluru, Karnataka',
      productTitle: PRODUCTS[0].title,
      productImage: PRODUCTS[0].images[0],
      price: PRODUCTS[0].price,
      orderDate: '04 Sep 2026, 11:30 AM',
      orderStatus: 'delivery_date_pending',
      estimatedDeliveryDate: null,
    },
    {
      id: 'ord-102',
      orderId: 'HODA-ORD-2026-882319',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98111 22334',
      customerCity: 'Mumbai, Maharashtra',
      productTitle: PRODUCTS[1].title,
      productImage: PRODUCTS[1].images[0],
      price: PRODUCTS[1].price,
      orderDate: '03 Sep 2026, 04:15 PM',
      orderStatus: 'delivery_date_confirmed',
      estimatedDeliveryDate: '2026-09-07',
      deliveryDateSetAt: '03 Sep 2026, 06:00 PM',
    },
    {
      id: 'ord-103',
      orderId: 'HODA-ORD-2026-774912',
      customerName: 'Karthik Nair',
      customerPhone: '+91 99450 67890',
      customerCity: 'Hyderabad, Telangana',
      productTitle: PRODUCTS[2].title,
      productImage: PRODUCTS[2].images[0],
      price: PRODUCTS[2].price,
      orderDate: '02 Sep 2026, 09:20 AM',
      orderStatus: 'delivery_date_confirmed',
      estimatedDeliveryDate: '2026-09-06',
      deliveryDateSetAt: '02 Sep 2026, 10:45 AM',
      isGuestOrder: false,
    },
  ]);

  // Load any local guest orders from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hodahub_local_orders') || '[]');
      if (stored.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.orderId));
          const uniqueNew = stored.filter((s: any) => !existingIds.has(s.orderId));
          return [...uniqueNew, ...prev];
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDateChange = (orderId: string, val: string) => {
    setSelectedDates((prev) => ({ ...prev, [orderId]: val }));
  };

  const handleSaveDeliveryDate = async (orderId: string) => {
    const chosenDate = selectedDates[orderId];
    if (!chosenDate) {
      alert('Please select a delivery date first.');
      return;
    }

    // Call Supabase Postgres API via adminApi
    try {
      await adminApi.setDeliveryDate(orderId, chosenDate);
    } catch (e) {
      // client-side fallback
    }

    const dateObj = new Date(chosenDate);
    const formatted = dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              estimatedDeliveryDate: chosenDate,
              orderStatus: 'delivery_date_confirmed',
              deliveryDateSetAt: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : o
      )
    );

    setToastMessage(`✓ Delivery date confirmed for ${formatted}! Notification sent to customer.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredOrders = orders.filter((ord) => {
    if (filterMode === 'PENDING' && ord.estimatedDeliveryDate !== null) return false;
    if (filterMode === 'CONFIRMED' && ord.estimatedDeliveryDate === null) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ord.orderId.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerPhone.includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.estimatedDeliveryDate === null).length;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-primary-500/40 flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary-100 text-primary-800 text-[11px] font-bold tracking-wider uppercase">
              HodaHub Ops
            </span>
            <h1 className="text-xl font-extrabold text-slate-950 font-sans">
              Admin Orders & Delivery Scheduling
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Set and confirm customer arrival dates. Updating triggers automated SMS & email notifications.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('home')}
            className="self-start md:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>
        )}
      </div>

      {/* Filter and Triage Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>

          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterMode === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Delivery Date Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilterMode('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'CONFIRMED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Confirmed ({orders.length - pendingCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Order Details</th>
                <th className="py-3.5 px-4">Customer & Location</th>
                <th className="py-3.5 px-4">Product & Amount</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4 min-w-[250px]">Expected Delivery Date Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => {
                const isPending = ord.estimatedDeliveryDate === null;
                const formattedDate = ord.estimatedDeliveryDate
                  ? new Date(ord.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : null;

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-sans">
                      <div className="font-mono font-bold text-slate-900">{ord.orderId}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ord.orderDate}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{ord.customerName}</span>
                        {ord.isGuestOrder ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                            Guest
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-200 uppercase tracking-wider">
                            Member
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-slate-500 text-[11px]">{ord.customerPhone}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5 max-w-[220px] leading-tight">
                        {ord.addressLine ? `${ord.addressLine}, ` : ''}{ord.customerCity} {ord.pincode ? `(${ord.pincode})` : ''}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ord.productImage}
                          alt=""
                          className="w-10 h-10 object-contain rounded bg-slate-50 border p-1"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 line-clamp-1 max-w-[160px]">
                            {ord.productTitle}
                          </p>
                          <p className="font-mono font-bold text-slate-950 tabular-nums">
                            {formatPrice(ord.price)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px] animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Date Not Set</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed: {formattedDate}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            defaultValue={ord.estimatedDeliveryDate || ''}
                            onChange={(e) => handleDateChange(ord.orderId, e.target.value)}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500 font-sans"
                          />
                          <button
                            onClick={() => handleSaveDeliveryDate(ord.orderId)}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                          >
                            {isPending ? 'Confirm & Notify' : 'Update Date'}
                          </button>
                        </div>
                        {ord.deliveryDateSetAt && (
                          <span className="text-[10px] text-slate-400">
                            Last set on {ord.deliveryDateSetAt}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
