import React from 'react';
import { Truck, Clock, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useAuthStore } from '../store/useAuthStore';

interface OrdersPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectProduct: (product: Product) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate, onSelectProduct }) => {
  const { user } = useAuthStore();

  const customerOrders = [
    {
      id: 'HODA-ORD-2026-904128',
      date: '04 Sep 2026',
      product: PRODUCTS[0], // iPhone 15 Pro
      price: PRODUCTS[0].price,
      // Delivery date pending case (GAP 2 requirement)
      estimatedDeliveryDate: null,
      statusText: 'Processing at fulfillment hub',
    },
    {
      id: 'HODA-ORD-2026-882319',
      date: '03 Sep 2026',
      product: PRODUCTS[1], // Sony Headphones
      price: PRODUCTS[1].price,
      // Delivery date confirmed case (GAP 2 requirement)
      estimatedDeliveryDate: '2026-09-07',
      statusText: 'Shipped via HodaExpress',
    },
    {
      id: 'HODA-ORD-2026-781904',
      date: '28 Aug 2026',
      product: PRODUCTS[2], // Samsung S24
      price: PRODUCTS[2].price,
      estimatedDeliveryDate: '2026-08-30',
      isDelivered: true,
      statusText: 'Delivered on 30 Aug 2026',
    },
  ];

  // Helper to compute countdown text
  const getDeliveryCountdown = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = target.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    if (diffDays <= 0) return { title: 'Arriving Today', subtitle: formattedDate };
    if (diffDays === 1) return { title: 'Arriving Tomorrow', subtitle: formattedDate };
    return { title: `Arriving in ${diffDays} days`, subtitle: formattedDate };
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-950 font-sans tracking-tight">
            My Orders & Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time delivery timelines, download tax invoices, and manage returns.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => onNavigate('admin-orders')}
            className="self-start sm:self-auto px-4 py-2 bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Truck className="w-4 h-4 text-primary-600" />
            <span>Open Admin Delivery Control</span>
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {customerOrders.map((ord) => {
          const isDatePending = !ord.estimatedDeliveryDate && !ord.isDelivered;
          const countdown = ord.estimatedDeliveryDate ? getDeliveryCountdown(ord.estimatedDeliveryDate) : null;

          return (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Order ID:</span>
                  <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-medium">Placed on {ord.date}</span>
                  <button
                    onClick={() => alert(`Invoice for ${ord.id} downloaded successfully.`)}
                    className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>

              {/* Product Info & Delivery Date Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Product Column */}
                <div className="md:col-span-7 flex items-center gap-4">
                  <div
                    onClick={() => onSelectProduct(ord.product)}
                    className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <img
                      src={ord.product.images[0]}
                      alt={ord.product.title}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <h3
                      onClick={() => onSelectProduct(ord.product)}
                      className="text-sm font-bold text-slate-950 hover:text-primary-600 cursor-pointer line-clamp-1"
                    >
                      {ord.product.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Seller: HodaRetail Direct • HodaAssured</p>
                    <div className="mt-1 font-mono font-bold text-slate-900 tabular-nums">
                      {formatPrice(ord.price)}
                    </div>
                  </div>
                </div>

                {/* Delivery Date Card (GAP 2 Requirement) */}
                <div className="md:col-span-5">
                  {ord.isDelivered ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">Delivered Successfully</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">{ord.statusText}</div>
                      </div>
                    </div>
                  ) : isDatePending ? (
                    // Subtle pending/pulse animation when date is not yet set
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">
                          Delivery date will be confirmed shortly
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Logistics dispatch in progress • You will receive an SMS
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Prominent delivery date with truck icon and countdown
                    <div className="p-3.5 rounded-xl bg-primary-50/90 border border-primary-200 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-primary-950">
                            {countdown?.title}
                          </div>
                          <div className="text-[11px] text-primary-700 font-semibold mt-0.5">
                            Expected by {countdown?.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-primary-600 text-white rounded text-[10px] font-bold tracking-wide uppercase">
                        On Time
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
