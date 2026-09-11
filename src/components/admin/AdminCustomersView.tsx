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
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { adminApi, AdminOrder } from '../../lib/adminApi';
import { formatPrice } from '../../lib/utils';

interface CustomerRecord {
  _id: string;
  name: string;
  phone: string;
  email: string;
  isRegistered: boolean;
  city: string;
  totalOrders: number;
  lifetimeSpend: number;
  lastOrderDate: string;
  orders: AdminOrder[];
}

export const AdminCustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-xs text-slate-500">
            Registered shopper accounts, guest checkout profiles, and lifetime purchasing telemetry.
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

      {/* Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-primary-500 font-sans"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          Total Customers: <span className="font-bold text-slate-900">{customers.length}</span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">City</th>
                <th className="py-3 px-3">Total Orders</th>
                <th className="py-3 px-3">Lifetime Spend</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading customer records...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers found matching search query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer._id || customer.phone}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                          {customer.name[0] || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{customer.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {customer._id.slice(0, 10)}
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
                        <span>{customer.email}</span>
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          <UserX className="w-3 h-3" />
                          <span>Guest</span>
                        </span>
                      )}
                    </td>

                    {/* City */}
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {customer.city || 'India'}
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {customer.totalOrders}
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {formatPrice(customer.lifetimeSpend)}
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>Orders</span>
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

      {/* CUSTOMER ORDER HISTORY DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm">Customer Order History</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {selectedCustomer.name} ({selectedCustomer.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Customer Stats Strip */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Total Orders</div>
                  <div className="text-base font-bold font-mono text-slate-900">
                    {selectedCustomer.totalOrders}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Lifetime Spend</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    {formatPrice(selectedCustomer.lifetimeSpend)}
                  </div>
                </div>
              </div>

              <div className="font-bold text-slate-900 uppercase font-mono text-[11px] tracking-wider pt-2">
                Order History Records
              </div>

              {selectedCustomer.orders.length === 0 ? (
                <div className="text-slate-400 py-6 text-center">No orders on record.</div>
              ) : (
                selectedCustomer.orders.map((ord, idx) => (
                  <div
                    key={ord._id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{ord.orderId}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPrice(ord.pricing?.total || 0)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Placed: {new Date(ord.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-[11px]">
                          <span className="line-clamp-1 max-w-[240px] text-slate-700">
                            {it.quantity}x {it.title}
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {formatPrice(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="font-mono font-bold text-slate-600 uppercase">
                        {ord.orderStatus.replace(/_/g, ' ')}
                      </span>
                      {ord.estimatedDeliveryDate && (
                        <span className="text-slate-500 font-mono">
                          Est: {ord.estimatedDeliveryDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
