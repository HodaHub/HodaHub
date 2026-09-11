import React, { useState, useEffect } from 'react';
import {
  TicketPercent,
  Plus,
  Trash2,
  Check,
  X,
  Calendar,
  Sparkles,
  Percent,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { adminApi, AdminCoupon } from '../../lib/adminApi';
import { formatPrice } from '../../lib/utils';

export const AdminCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountAmount, setDiscountAmount] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('1999');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [validUntil, setValidUntil] = useState('2027-12-31');
  const [usageLimit, setUsageLimit] = useState('5000');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleDelete = async (id: string, codeName: string) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove coupon "${codeName}"?`)) {
      return;
    }

    try {
      await adminApi.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id && c.code !== id));
      showToast(`Coupon "${codeName}" deleted successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountAmount) {
      alert('Coupon code and discount amount are required.');
      return;
    }

    try {
      const created = await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountAmount: Number(discountAmount),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        validUntil: new Date(validUntil).toISOString(),
        usageLimit: Number(usageLimit) || 1000,
      });

      setCoupons((prev) => [created, ...prev]);
      setShowModal(false);
      showToast(`Coupon code "${created.code}" created successfully.`);

      // Reset
      setCode('');
      setDiscountAmount('');
      setMaxDiscount('');
    } catch (err: any) {
      alert(err.message || 'Failed to create coupon');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Coupons & Promotions</h2>
          <p className="text-xs text-slate-500">
            Create discount voucher campaigns, set minimum cart requirements, and manage promo codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCoupons}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Discount Value</th>
                <th className="py-3 px-3">Min Order</th>
                <th className="py-3 px-3">Max Cap</th>
                <th className="py-3 px-3">Validity</th>
                <th className="py-3 px-3">Usage Count</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading promotional vouchers...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No active discount coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
                          <TicketPercent className="w-4 h-4" />
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                          {coupon.code}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 capitalize font-medium text-slate-700">
                      {coupon.discountType}
                    </td>

                    {/* Discount Value */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountAmount}% OFF`
                        : formatPrice(coupon.discountAmount)}
                    </td>

                    {/* Min Order */}
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {formatPrice(coupon.minOrderValue)}
                    </td>

                    {/* Max Cap */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {coupon.maxDiscount ? formatPrice(coupon.maxDiscount) : 'No Cap'}
                    </td>

                    {/* Validity */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Usage */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <span className="font-bold text-slate-900">{coupon.usedCount || 0}</span> /{' '}
                      {coupon.usageLimit || '∞'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {coupon.isActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(coupon._id, coupon.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-16 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm">Create HodaHub Coupon Code</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase font-bold focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-primary-500 focus:outline-none cursor-pointer"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Cart Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1999"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional cap for %"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
