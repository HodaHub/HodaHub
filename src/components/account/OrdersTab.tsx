import React, { useState } from 'react';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  MapPin,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  X,
  FileText,
} from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { PRODUCTS } from '../../data/products';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';

interface OrdersTabProps {
  onNavigate?: (page: string, params?: Record<string, any>) => void;
  onSelectProduct?: (product: Product) => void;
}

interface UserOrder {
  id: string;
  orderId: string;
  date: string;
  items: Array<{
    product: Product;
    quantity: number;
    price: number;
    variant?: string;
    color?: string;
  }>;
  totalPrice: number;
  orderStatus: 'delivery_date_pending' | 'delivery_date_confirmed' | 'shipped' | 'delivered';
  estimatedDeliveryDate: string | null;
  awbNumber?: string;
  shippingAddress: {
    name: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ onNavigate, onSelectProduct }) => {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  // Initial user orders (seeded with realistic HodaHub orders + any locally placed orders)
  const [orders] = useState<UserOrder[]>(() => {
    const baseOrders: UserOrder[] = [
      {
        id: 'ord-101',
        orderId: 'HODA-ORD-2026-904128',
        date: '04 Sep 2026',
        items: [
          {
            product: PRODUCTS[0], // iPhone 15 Pro
            quantity: 1,
            price: PRODUCTS[0].price,
            variant: '256 GB',
            color: 'Natural Titanium',
          },
        ],
        totalPrice: PRODUCTS[0].price,
        orderStatus: 'delivery_date_pending',
        estimatedDeliveryDate: null,
        awbNumber: 'HODA-XPR-8821901',
        shippingAddress: {
          name: 'Anand Rao',
          addressLine: 'Flat 402, Green Orchid Apartments, 12th Main',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          phone: '+91 98765 43210',
        },
      },
      {
        id: 'ord-102',
        orderId: 'HODA-ORD-2026-882319',
        date: '03 Sep 2026',
        items: [
          {
            product: PRODUCTS[1], // Sony Headphones
            quantity: 1,
            price: PRODUCTS[1].price,
            color: 'Silver Platinum',
          },
        ],
        totalPrice: PRODUCTS[1].price,
        orderStatus: 'shipped',
        estimatedDeliveryDate: '2026-09-07',
        awbNumber: 'HODA-AWB-4491028',
        shippingAddress: {
          name: 'Anand Rao',
          addressLine: 'Flat 402, Green Orchid Apartments, 12th Main',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          phone: '+91 98765 43210',
        },
      },
      {
        id: 'ord-103',
        orderId: 'HODA-ORD-2026-774912',
        date: '28 Aug 2026',
        items: [
          {
            product: PRODUCTS[2], // Samsung S24 Ultra
            quantity: 1,
            price: PRODUCTS[2].price,
            variant: '512 GB',
            color: 'Titanium Gray',
          },
        ],
        totalPrice: PRODUCTS[2].price,
        orderStatus: 'delivered',
        estimatedDeliveryDate: '2026-08-30',
        awbNumber: 'HODA-AWB-2299104',
        shippingAddress: {
          name: 'Anand Rao',
          addressLine: 'Flat 402, Green Orchid Apartments, 12th Main',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          phone: '+91 98765 43210',
        },
      },
    ];

    try {
      const local = JSON.parse(localStorage.getItem('hodahub_local_orders') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const mapped = local.map((loc: any, idx: number) => ({
          id: loc.orderId || `loc-${idx}`,
          orderId: loc.orderId,
          date: loc.orderDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          items: [
            {
              product: PRODUCTS[0],
              quantity: 1,
              price: loc.price || loc.pricing?.total || 2499,
            },
          ],
          totalPrice: loc.price || loc.pricing?.total || 2499,
          orderStatus: (loc.orderStatus as any) || 'delivery_date_pending',
          estimatedDeliveryDate: loc.estimatedDeliveryDate || null,
          awbNumber: loc.awbNumber || 'HODA-AWB-PENDING',
          shippingAddress: {
            name: loc.customerName || loc.shippingAddress?.name || 'Customer',
            addressLine: loc.addressLine || loc.shippingAddress?.addressLine || 'Street Address',
            city: loc.customerCity || loc.shippingAddress?.city || 'Bengaluru',
            state: loc.shippingAddress?.state || 'Karnataka',
            pincode: loc.pincode || loc.shippingAddress?.pincode || '560001',
            phone: loc.customerPhone || loc.shippingAddress?.phone || '+91 98765 43210',
          },
        }));

        return [...mapped, ...baseOrders];
      }
    } catch {
      // ignore
    }

    return baseOrders;
  });

  const handleReorder = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    setReorderSuccessMsg(`Added "${product.title}" to your HodaHub cart.`);
    setTimeout(() => setReorderSuccessMsg(null), 3500);
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'delivery_date_pending':
        return 0;
      case 'delivery_date_confirmed':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const steps = [
    { label: 'Order Confirmed', desc: 'Verified & packed at warehouse' },
    { label: 'Date Confirmed', desc: 'Fulfillment delivery promise set' },
    { label: 'In Transit', desc: 'Shipped via HodaExpress logistics' },
    { label: 'Delivered', desc: 'Package handed over to recipient' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {reorderSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>{reorderSuccessMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Orders & Purchases</h2>
          <p className="text-xs text-slate-500">
            Track real-time shipment status, view item snapshots, and repeat past orders.
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-600">
          Total Orders: <span className="text-slate-900">{orders.length}</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isPending =
            !order.estimatedDeliveryDate || order.orderStatus === 'delivery_date_pending';

          return (
            <div
              key={order.orderId}
              onClick={() => setSelectedOrder(order)}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-primary-300 transition-all cursor-pointer group"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="font-mono font-bold text-slate-900">
                    {order.orderId}
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="text-slate-500 font-mono text-[11px]">{order.date}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      order.orderStatus === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.orderStatus === 'shipped'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
                        }
                        alt={item.product?.title || 'Product'}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1 max-w-md">
                          {item.product?.title || 'HodaHub Item'}
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Qty: <span className="font-mono font-bold text-slate-800">{item.quantity}</span>
                          {item.variant && ` • ${item.variant}`}
                          {item.color && ` • ${item.color}`}
                        </div>
                        <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery & Action Button */}
                <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400 font-mono font-bold">
                      Delivery Promise
                    </div>
                    {order.estimatedDeliveryDate ? (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        <span>{order.estimatedDeliveryDate}</span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Date Pending</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {order.items[0]?.product && (
                      <button
                        onClick={(e) => handleReorder(order.items[0].product, e)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Truck className="w-3 h-3" />
                      <span>Track</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>
                    Delivering to {order.shippingAddress.name} ({order.shippingAddress.city})
                  </span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL ORDER DETAIL & TRACKING TIMELINE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-primary-400" />
                <div>
                  <h3 className="font-bold text-sm">HodaExpress Logistics Tracking</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Order ID: {selectedOrder.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Delivery Status Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium uppercase font-mono">
                    Expected Delivery
                  </span>
                  {selectedOrder.estimatedDeliveryDate ? (
                    <p className="text-base font-extrabold text-emerald-700 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedOrder.estimatedDeliveryDate}</span>
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4" />
                      <span>Logistics confirmation in progress</span>
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 font-medium uppercase font-mono">
                    Tracking AWB
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                    {selectedOrder.awbNumber || 'Generating courier AWB...'}
                  </p>
                </div>
              </div>

              {/* 4-Step Progress Tracker */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider mb-6">
                  Fulfillment Milestone Progress
                </p>
                <div className="relative flex justify-between items-center text-[11px] px-2">
                  <div className="absolute top-3.5 left-6 right-6 h-1 bg-slate-100 -z-0" />
                  {steps.map((step, idx) => {
                    const currentIdx = getStatusStepIndex(selectedOrder.orderStatus);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.label} className="flex flex-col items-center text-center z-10 max-w-[100px]">
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
                        <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ordered Items */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                  Item Snapshot
                </p>
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
                        }
                        alt={item.product?.title || 'Item'}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-50"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {item.product?.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Qty: <span className="font-mono font-bold text-slate-800">{item.quantity}</span>
                          {item.variant && ` • ${item.variant}`}
                          {item.color && ` • ${item.color}`}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Destination Address */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  <span>Shipping Address</span>
                </div>
                <div className="font-semibold text-slate-800">
                  {selectedOrder.shippingAddress.name}
                </div>
                <div className="text-slate-600 leading-snug">
                  {selectedOrder.shippingAddress.addressLine}, {selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.state} -{' '}
                  <span className="font-mono font-bold">{selectedOrder.shippingAddress.pincode}</span>
                </div>
                <div className="text-slate-600 font-mono pt-0.5">
                  Phone: {selectedOrder.shippingAddress.phone}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <div className="font-mono">
                  <span className="text-slate-500 text-xs">Total Amount: </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatPrice(selectedOrder.totalPrice)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
