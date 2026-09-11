import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Phone,
  FileText,
} from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface TrackOrderPageProps {
  onNavigate?: (page: string, params?: Record<string, any>) => void;
}

interface OrderTrackingResult {
  orderId: string;
  orderStatus: string;
  estimatedDeliveryDate: string | null;
  deliveryDateSetAt?: string | null;
  createdAt?: string;
  itemCount?: number;
  city?: string;
  isGuestOrder?: boolean;
  pricing?: {
    total?: number;
  };
  trackingHistory?: Array<{
    status: string;
    timestamp?: string;
    note?: string;
  }>;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ onNavigate }) => {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const cleanOrder = orderIdInput.trim();
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);

    if (!cleanOrder) {
      setError('Please enter your HodaHub Order ID (e.g. HODA-ORD-2026-XXXXXX).');
      return;
    }
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter the valid 10-digit mobile number used when placing the order.');
      return;
    }

    setLoading(true);

    try {
      // Invoke Supabase Edge Function to safely query guest order via service_role key
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('guest-order-track', {
        body: { orderId: cleanOrder, phone: cleanPhone },
      }).catch(() => ({ data: null, error: null }));

      if (edgeData && edgeData.found && edgeData.data) {
        setResult(edgeData.data);
      } else {
        // Check for local storage backup (if order placed locally in dev/offline mode)
        const localSavedOrders = JSON.parse(localStorage.getItem('hodahub_local_orders') || '[]');
        const found = localSavedOrders.find(
          (o: any) =>
            (o.orderId?.toUpperCase() === cleanOrder.toUpperCase() || o.id === cleanOrder) &&
            (o.phone?.replace(/\D/g, '').slice(-10) === cleanPhone ||
              o.shippingAddress?.phone?.replace(/\D/g, '').slice(-10) === cleanPhone ||
              o.customerPhone?.replace(/\D/g, '').slice(-10) === cleanPhone)
        );

        if (found) {
          setResult({
            orderId: found.orderId,
            orderStatus: found.orderStatus || 'delivery_date_pending',
            estimatedDeliveryDate: found.estimatedDeliveryDate || null,
            deliveryDateSetAt: found.deliveryDateSetAt || null,
            createdAt: found.orderDate || new Date().toISOString(),
            city: found.shippingAddress?.city || found.customerCity || 'Bengaluru',
            pricing: { total: found.price || found.pricing?.total || 2499 },
            isGuestOrder: true,
            trackingHistory: [
              {
                status: 'delivery_date_pending',
                timestamp: new Date().toISOString(),
                note: 'Order placed on HodaHub (Guest Checkout).',
              },
            ],
          });
        } else {
          setError(
            'No order matching this Order ID and Phone Number was found on HodaHub. Please double-check your details.'
          );
        }
      }
    } catch (err) {
      setError('Unable to fetch tracking status at the moment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'delivery_date_pending':
      case 'pending':
        return 0;
      case 'confirmed':
      case 'delivery_date_confirmed':
        return 1;
      case 'packed':
        return 2;
      case 'shipped':
        return 3;
      case 'out_for_delivery':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Placed', desc: 'Order confirmed' },
    { label: 'Date Scheduled', desc: 'Delivery assigned' },
    { label: 'Packed', desc: 'HodaAssured hub' },
    { label: 'Shipped', desc: 'In transit' },
    { label: 'Delivered', desc: 'At doorstep' },
  ];

  return (
    <div className="min-h-[75vh] max-w-4xl mx-auto px-4 py-10 sm:py-14">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold tracking-wide uppercase mb-3">
          <Truck className="w-3.5 h-3.5" />
          <span>HodaHub Live Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight">
          Track Your HodaHub Order
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          No login required. Enter the 10-digit mobile number and Order ID from your confirmation SMS/receipt.
        </p>
      </div>

      {/* Tracking Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                HodaHub Order ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. HODA-ORD-2026-904128"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking HodaHub Logistics...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order Status</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tracking Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 max-w-2xl mx-auto space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                  Order Reference
                </span>
                <p className="font-mono font-bold text-base text-slate-950">{result.orderId}</p>
              </div>

              <div className="flex items-center gap-2">
                {result.isGuestOrder && (
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-full">
                    Guest Order
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HodaAssured</span>
                </span>
              </div>
            </div>

            {/* Estimated Delivery Status */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 font-medium">Expected Delivery Date</span>
                {result.estimatedDeliveryDate ? (
                  <p className="text-base font-extrabold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(result.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4" />
                    <span>Delivery date confirmation pending with logistics</span>
                  </p>
                )}
              </div>

              {result.city && (
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 font-medium">Destination</span>
                  <p className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    <span>{result.city}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Step Progress Tracker */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Fulfillment Progress
              </p>
              <div className="relative flex justify-between items-center text-[11px]">
                <div className="absolute top-3.5 left-4 right-4 h-1 bg-slate-100 -z-0" />
                {steps.map((step, idx) => {
                  const currentIdx = getStatusStepIndex(result.orderStatus);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.label} className="flex flex-col items-center text-center z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`mt-2 font-bold text-xs ${
                          isCurrent ? 'text-primary-600' : isDone ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            {onNavigate && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => onNavigate('home')}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <span>Continue Shopping on HodaHub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
