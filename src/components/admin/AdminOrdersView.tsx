import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  MapPin,
  ExternalLink,
  Package,
} from 'lucide-react';
import { adminApi, AdminOrder } from '../../lib/adminApi';
import { formatPrice } from '../../lib/utils';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getOrders({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setOrders(list);
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleToggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleDateSelect = (orderId: string, val: string) => {
    setSelectedDates((prev) => ({ ...prev, [orderId]: val }));
  };

  const handleSaveDeliveryDate = async (orderId: string) => {
    const chosenDate = selectedDates[orderId];
    if (!chosenDate) {
      alert('Please select an estimated delivery date first.');
      return;
    }

    setUpdatingId(orderId);
    try {
      const updated = await adminApi.setDeliveryDate(
        orderId,
        chosenDate,
        'Estimated delivery date confirmed by HodaHub Fulfillment Center'
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.orderId === orderId ? { ...o, ...updated } : o))
      );
      showToast(`Confirmed delivery date: ${chosenDate} for Order #${orderId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery date');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRetryShipment = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await adminApi.updateOrderStatus(
        orderId,
        'shipped',
        'Shipment generation re-triggered and AWB assigned'
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.orderId === orderId ? { ...o, ...updated } : o))
      );
      showToast(`Shipment successfully generated with AWB #${updated.awbNumber || 'HODA-AWB'}`);
    } catch (err: any) {
      alert(err.message || 'Failed to retry shipment generation');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by search query
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderIdMatch = o.orderId.toLowerCase().includes(q);
    const customerMatch =
      o.shippingAddress?.name.toLowerCase().includes(q) ||
      o.shippingAddress?.phone.toLowerCase().includes(q) ||
      o.shippingAddress?.city.toLowerCase().includes(q);
    const itemMatch = o.items.some((i) => i.title.toLowerCase().includes(q));
    return orderIdMatch || customerMatch || itemMatch;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Orders Fulfillment</h2>
          <p className="text-xs text-slate-500">
            Dispatch queue, logistics tracking, delivery scheduling, and fulfillment operations.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/90 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none font-medium cursor-pointer"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="delivery_date_pending">Delivery Date Pending</option>
            <option value="delivery_date_confirmed">Delivery Date Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-3">Customer Type</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3">Total Payable</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Delivery Date</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Fetching HodaHub orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order._id || expandedOrderId === order.orderId;
                  const isPending =
                    !order.estimatedDeliveryDate ||
                    order.orderStatus === 'delivery_date_pending';

                  return (
                    <React.Fragment key={order._id || order.orderId}>
                      {/* Main Row */}
                      <tr
                        onClick={() => handleToggleExpand(order._id || order.orderId)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/90' : ''
                        }`}
                      >
                        {/* Order ID & Time */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {order.orderId}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(order.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        </td>

                        {/* Customer Type / Badge */}
                        <td className="py-3.5 px-3">
                          {order.isGuestOrder ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                              <UserX className="w-3 h-3" />
                              <span>Guest Order</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              <UserCheck className="w-3 h-3" />
                              <span>Registered</span>
                            </span>
                          )}
                          <div className="font-semibold text-slate-800 text-[11px] mt-1">
                            {order.shippingAddress?.name || 'Customer'}
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-slate-800 line-clamp-1">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            PIN: {order.shippingAddress?.pincode}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                          {formatPrice(order.pricing?.total || 0)}
                          <div className="text-[10px] uppercase text-slate-500 font-normal">
                            {order.paymentMethod} • {order.paymentStatus}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              order.orderStatus === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.orderStatus === 'shipped'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </td>

                        {/* Delivery Date */}
                        <td className="py-3.5 px-3 font-mono text-[11px]">
                          {order.estimatedDeliveryDate ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {order.estimatedDeliveryDate}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium italic flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending Set
                            </span>
                          )}
                        </td>

                        {/* Expand Icon */}
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Details Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-4 sm:p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                              {/* 1. Items List */}
                              <div className="md:col-span-2 space-y-3">
                                <div className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-primary-600" />
                                  <span>Order Item Snapshot ({order.items.length})</span>
                                </div>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                                    >
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
                                          alt={item.title}
                                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                                        />
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs">
                                            {item.title}
                                          </div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            Qty: <span className="font-mono font-bold text-slate-800">{item.quantity}</span>
                                            {item.variant && ` • ${item.variant}`}
                                            {item.color && ` • Color: ${item.color}`}
                                            {item.sku && ` • SKU: ${item.sku}`}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="font-mono font-bold text-xs text-slate-900 text-right">
                                        {formatPrice(item.price * item.quantity)}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Logistics / AWB info */}
                                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                  <div>
                                    <div className="text-slate-500 font-medium text-[11px]">Courier Logistics AWB</div>
                                    <div className="font-mono font-bold text-slate-900">
                                      {order.awbNumber || 'No AWB assigned yet'}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetryShipment(order._id || order.orderId);
                                    }}
                                    disabled={updatingId === (order._id || order.orderId)}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                                  >
                                    {order.awbNumber ? 'Re-sync Shipment' : 'Create & Assign AWB'}
                                  </button>
                                </div>
                              </div>

                              {/* 2. Customer & Delivery Actions Box */}
                              <div className="space-y-4">
                                {/* Shipping Address Card */}
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                                  <div className="font-bold text-slate-900 uppercase font-mono text-[10px] tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                    <span>Shipping Destination</span>
                                  </div>
                                  <div className="font-semibold text-slate-800">
                                    {order.shippingAddress?.name}
                                  </div>
                                  <div className="text-slate-600 leading-snug">
                                    {order.shippingAddress?.addressLine}
                                    {order.shippingAddress?.locality && `, ${order.shippingAddress.locality}`}
                                    <br />
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state} -{' '}
                                    <span className="font-mono font-bold">{order.shippingAddress?.pincode}</span>
                                  </div>
                                  <div className="font-mono text-slate-700 pt-1">
                                    Phone: {order.shippingAddress?.phone}
                                  </div>
                                </div>

                                {/* Delivery Date Assignment Form */}
                                <div className="p-4 bg-primary-50/50 border border-primary-200/80 rounded-xl space-y-3 text-xs">
                                  <div className="font-bold text-primary-950 font-mono uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                                    <span>Set / Update Delivery Date</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    Assign confirmed promise date. Customer will receive SMS & WhatsApp notification.
                                  </p>

                                  <div className="space-y-2">
                                    <input
                                      type="date"
                                      value={
                                        selectedDates[order._id || order.orderId] ||
                                        order.estimatedDeliveryDate ||
                                        ''
                                      }
                                      onChange={(e) =>
                                        handleDateSelect(order._id || order.orderId, e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-primary-500 cursor-pointer"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveDeliveryDate(order._id || order.orderId);
                                      }}
                                      disabled={updatingId === (order._id || order.orderId)}
                                      className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {updatingId === (order._id || order.orderId)
                                        ? 'Saving...'
                                        : 'Confirm Delivery Date'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
