import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Phone,
  Mail,
  ShoppingBag,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MapPin,
  Wallet,
  Calendar,
  Truck,
  Package,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { adminApi, AdminOrder, CustomerRecord } from '../../lib/adminApi';
import { formatPrice } from '../../lib/utils';

export const AdminCustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REGISTERED' | 'GUEST'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
      // If a customer is currently selected, update their state with fresh orders
      if (selectedCustomer) {
        const fresh = data.find((c) => c._id === selectedCustomer._id);
        if (fresh) setSelectedCustomer(fresh);
      }
    } catch (err) {
      console.error('Failed to load customers from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const filteredCustomers = customers.filter((c) => {
    // Filter by type (Registered vs Guest)
    if (statusFilter === 'REGISTERED' && !c.isRegistered) return false;
    if (statusFilter === 'GUEST' && c.isRegistered) return false;

    // Filter by search query (Name, Phone, Email, City)
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Registered shopper profiles, verified credentials, wallet balances, and real-time order history.
          </p>
        </div>
        <button
          onClick={loadCustomers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone (+91), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary-500 font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setStatusFilter('REGISTERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'REGISTERED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Registered OTP ({customers.filter((c) => c.isRegistered).length})
          </button>
          <button
            onClick={() => setStatusFilter('GUEST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'GUEST'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Guests ({customers.filter((c) => !c.isRegistered).length})
          </button>
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Signup Date</th>
                <th className="py-3 px-3">Wallet</th>
                <th className="py-3 px-3">Total Orders</th>
                <th className="py-3 px-3">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary-600" />
                      <span>Loading customer telemetry from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customer accounts match your search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id || customer.phone}
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shrink-0">
                          {customer.name ? customer.name[0].toUpperCase() : 'H'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 hover:text-primary-600 transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {customer.city || 'India'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-800 flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1.5 text-[11px] mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{customer.email || 'No email provided'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {customer.isRegistered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          <span>OTP Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          <UserX className="w-3 h-3" />
                          <span>Guest</span>
                        </span>
                      )}
                    </td>

                    {/* Signup Date */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {customer.signupDate
                        ? new Date(customer.signupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-3 font-mono">
                      <span className={`font-semibold ${customer.walletBalance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {formatPrice(customer.walletBalance || 0)}
                      </span>
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        <ShoppingBag className="w-3 h-3 text-slate-500" />
                        <span>{customer.totalOrders}</span>
                      </span>
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {formatPrice(customer.lifetimeSpend || 0)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-primary-200/60"
                      >
                        <span>Profile & Orders</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CUSTOMER PROFILE & FULL ORDER HISTORY DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md">
                  {selectedCustomer.name[0]?.toUpperCase() || 'H'}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    {selectedCustomer.isRegistered ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Verified Member
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                        Guest
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                title="Close Customer Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Profile Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Orders</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    {selectedCustomer.totalOrders}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Total Spend</div>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {formatPrice(selectedCustomer.lifetimeSpend || 0)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Wallet Balance</div>
                  <div className="text-base font-bold font-mono text-amber-700 mt-0.5 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-amber-500" />
                    <span>{formatPrice(selectedCustomer.walletBalance || 0)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Registered</div>
                  <div className="text-[11px] font-bold font-mono text-slate-700 mt-1 truncate">
                    {selectedCustomer.signupDate
                      ? new Date(selectedCustomer.signupDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Contact Actions Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 text-[11px]">Primary Contact Details</div>
                  <div className="text-slate-500 text-[11px] font-mono">{selectedCustomer.email || 'No email provided'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCustomer.phone && (
                    <>
                      <a
                        href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-[11px] cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Saved Shipping Addresses */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-900 uppercase font-mono text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    <span>Saved Shipping Addresses ({selectedCustomer.addresses?.length || 0})</span>
                  </span>
                </div>

                {!selectedCustomer.addresses || selectedCustomer.addresses.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-500 text-center text-[11px]">
                    No saved addresses on file for this customer.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedCustomer.addresses.map((addr, idx) => (
                      <div
                        key={addr.id || idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {addr.city}, {addr.state} - <span className="font-mono">{addr.pincode}</span>
                          </span>
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-primary-50 text-primary-700 rounded border border-primary-200">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Order History Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-900 uppercase font-mono text-[11px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                    <span>Customer Order History ({selectedCustomer.orders?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Real database records</span>
                </div>

                {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                  <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-700 text-xs">No Orders Found</div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      This customer has not placed any orders yet on HodaHub.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((ord) => {
                      const isExpanded = !!expandedOrders[ord._id || ord.orderId];

                      return (
                        <div
                          key={ord._id || ord.orderId}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          {/* Order Header Summary */}
                          <div className="p-4 space-y-3 bg-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  #{ord.orderId}
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Placed:{' '}
                                  {new Date(ord.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-sm text-emerald-700">
                                  {formatPrice(ord.pricing?.total || 0)}
                                </span>
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                                      ord.orderStatus === 'delivered'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : ord.orderStatus === 'shipped' || ord.orderStatus === 'out_for_delivery'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : ord.orderStatus === 'cancelled'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {ord.orderStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Logistics & Payment Meta Strip */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600">
                              <div>
                                Payment:{' '}
                                <span className="font-bold text-slate-800">{ord.paymentMethod}</span> (
                                <span
                                  className={
                                    ord.paymentStatus === 'completed'
                                      ? 'text-emerald-600 font-bold'
                                      : 'text-amber-600 font-bold'
                                  }
                                >
                                  {ord.paymentStatus}
                                </span>
                                )
                              </div>
                              <div className="text-right truncate">
                                Courier:{' '}
                                <span className="font-bold text-slate-800">
                                  {ord.courierName || 'Delhivery'}
                                </span>{' '}
                                {ord.awbNumber ? `(AWB: ${ord.awbNumber})` : ''}
                              </div>
                            </div>

                            {/* Expand / Collapse Toggle Button */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-500">
                                {ord.items?.length || 0} item{(ord.items?.length || 0) !== 1 ? 's' : ''} in shipment
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleOrderExpand(ord._id || ord.orderId)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide Details' : 'View Order Items'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Order Items Detail Area */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                              <div className="space-y-2">
                                {(ord.items || []).map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                                  >
                                    <div className="flex items-center gap-2 max-w-[280px]">
                                      <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                        <Package className="w-4 h-4 text-slate-500" />
                                      </div>
                                      <div className="truncate">
                                        <div className="font-bold text-slate-800 truncate">{it.title}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          SKU: {it.sku || 'HODA-ITEM'} • Qty: {it.quantity}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="font-mono font-bold text-slate-900 text-right">
                                      {formatPrice(it.price * it.quantity)}
                                      <div className="text-[9px] text-slate-400 font-normal">
                                        {formatPrice(it.price)} each
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Shipping Address for this Order */}
                              {ord.shippingAddress && (
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-600">
                                  <div className="font-bold text-slate-800 mb-0.5">Shipping Destination:</div>
                                  <div>
                                    {ord.shippingAddress.name} ({ord.shippingAddress.phone})
                                  </div>
                                  <div>
                                    {ord.shippingAddress.addressLine}
                                    {ord.shippingAddress.locality ? `, ${ord.shippingAddress.locality}` : ''}
                                  </div>
                                  <div>
                                    {ord.shippingAddress.city}, {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
