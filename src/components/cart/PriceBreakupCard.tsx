import React, { useState, useEffect } from 'react';
import { ShieldCheck, Tag, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { formatPrice } from '../../lib/utils';
import { adminApi, AdminCoupon } from '../../lib/adminApi';

interface PriceBreakupCardProps {
  onCheckout?: () => void;
  ctaText?: string;
  disabled?: boolean;
}

export const PriceBreakupCard: React.FC<PriceBreakupCardProps> = ({
  onCheckout,
  ctaText = 'Place Order',
  disabled = false,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [availableCoupons, setAvailableCoupons] = useState<AdminCoupon[]>([]);

  const totalCount = useCartStore((state) => state.getTotalCount());
  const totalMRP = useCartStore((state) => state.getTotalMRP());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const savings = useCartStore((state) => state.getSavings());
  const deliveryFee = useCartStore((state) => state.getDeliveryFee());
  const finalTotal = useCartStore((state) => state.getFinalTotal());
  const promoCode = useCartStore((state) => state.promoCode);
  const promoDiscount = useCartStore((state) => state.promoDiscount);
  const applyPromo = useCartStore((state) => state.applyPromo);
  const removePromo = useCartStore((state) => state.removePromo);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const list = await adminApi.getCoupons();
        setAvailableCoupons(list || []);
      } catch (_) {}
    };
    loadCoupons();
  }, []);

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = await applyPromo(promoInput);
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message });
      setPromoInput('');
    } else {
      setPromoFeedback({ type: 'error', message: res.message });
    }
  };

  const handleQuickPromo = async (code: string) => {
    const res = await applyPromo(code);
    if (res.success) {
      setPromoFeedback({ type: 'success', message: res.message });
    } else {
      setPromoFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 sticky top-24">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
        Price Details ({totalCount} {totalCount === 1 ? 'Item' : 'Items'})
      </h3>

      {/* Breakup rows */}
      <div className="py-4 space-y-3 text-sm text-slate-700">
        <div className="flex justify-between items-center">
          <span>Price (Total MRP)</span>
          <span className="font-mono tabular-nums text-slate-900 font-medium">
            {formatPrice(totalMRP)}
          </span>
        </div>

        <div className="flex justify-between items-center text-emerald-600">
          <span>Discount on MRP</span>
          <span className="font-mono tabular-nums font-semibold">
            - {formatPrice(totalMRP - subtotal)}
          </span>
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between items-center text-emerald-600">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Coupon ({promoCode})</span>
            </span>
            <span className="font-mono tabular-nums font-semibold">
              - {formatPrice(promoDiscount)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span>Delivery Charges</span>
          <span className="font-mono tabular-nums font-semibold">
            {deliveryFee === 0 ? (
              <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Secured Packaging & Delivery</span>
          <span className="font-mono text-emerald-600 font-semibold">FREE</span>
        </div>
      </div>

      {/* Coupon Field */}
      <div className="pt-2 pb-4 border-t border-slate-100">
        {promoCode ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Code <strong>{promoCode}</strong> applied</span>
            </div>
            <button
              onClick={removePromo}
              className="text-rose-600 hover:text-rose-700 font-bold text-xs underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <form onSubmit={handleApplyCode} className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoFeedback({ type: null, message: '' });
                }}
                placeholder="Enter Promo Code"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase placeholder-normal focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Apply
              </button>
            </form>

            {/* Dynamic available coupon chips */}
            {availableCoupons.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-slate-400">Available:</span>
                {availableCoupons.slice(0, 3).map((cpn) => (
                  <button
                    key={cpn._id || cpn.code}
                    type="button"
                    onClick={() => handleQuickPromo(cpn.code)}
                    className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-mono font-bold transition-colors"
                  >
                    {cpn.code} ({cpn.discountType === 'percentage' ? `${cpn.discountAmount}% off` : `₹${cpn.discountAmount} off`})
                  </button>
                ))}
              </div>
            )}

            {promoFeedback.message && (
              <p
                className={`mt-2 text-xs flex items-center gap-1 ${
                  promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {promoFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{promoFeedback.message}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Total Amount in bold JetBrains Mono tabular-nums */}
      <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-baseline mb-4">
        <div>
          <span className="text-base font-extrabold text-slate-950 font-sans">Total Amount</span>
          <p className="text-[11px] text-slate-400">Inclusive of all applicable taxes</p>
        </div>
        <span className="text-2xl font-black font-mono tabular-nums text-slate-950">
          {formatPrice(finalTotal)}
        </span>
      </div>

      {/* Highlight Savings Banner */}
      {savings > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2.5 mb-4 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            You will save {formatPrice(savings)} on this purchase!
          </span>
        </div>
      )}

      {/* Action CTA */}
      {onCheckout && (
        <button
          onClick={onCheckout}
          disabled={disabled || totalCount === 0}
          className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-primary-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>{ctaText}</span>
        </button>
      )}

      {/* Trust reassurance badge */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs text-center">
        <ShieldCheck className="w-4 h-4 text-primary-600" />
        <span>Safe and Secure 256-Bit SSL Checkout</span>
      </div>
    </div>
  );
};
