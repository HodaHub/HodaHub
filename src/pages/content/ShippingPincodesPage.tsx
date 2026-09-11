import React, { useState } from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Truck, MapPin, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const ShippingPincodesPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<any>(null);

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim();
    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setResult({ error: 'Please enter a valid 6-digit postal pincode.' });
      return;
    }

    // Metro vs Regional simulation
    const isMetro = ['5600', '1100', '4000', '7000', '6000', '5000'].some((prefix) =>
      clean.startsWith(prefix)
    );

    setResult({
      pincode: clean,
      deliverySpeed: isMetro ? 'Next Day Express' : 'Standard 2-3 Days',
      codAvailable: true,
      freeDeliveryEligible: true,
      hub: isMetro ? 'Metro Automated Sorting Center' : 'Regional Hub',
    });
  };

  return (
    <ContentPageLayout
      title="Shipping & Pincode Coverage"
      subtitle="Pan-India delivery across 19,000+ pin codes via our dedicated HodaExpress fulfillment network."
      category="Help & Support"
      onNavigate={onNavigate}
    >
      {/* Interactive Pincode Checker Widget */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-900 to-slate-900 text-white space-y-4">
        <div>
          <h3 className="text-base font-bold">Check Delivery Speed for Your Pincode</h3>
          <p className="text-xs text-primary-200 mt-0.5">Verify express shipping timelines and COD availability.</p>
        </div>

        <form onSubmit={checkPincode} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter 6-digit Pincode (e.g. 560001)"
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
          >
            Check Availability
          </button>
        </form>

        {result && (
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs space-y-2">
            {result.error ? (
              <p className="text-rose-300 font-bold">{result.error}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-black/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Speed</span>
                  <span className="font-bold text-emerald-400">{result.deliverySpeed}</span>
                </div>
                <div className="p-2 rounded bg-black/20">
                  <span className="text-[10px] text-slate-400 block uppercase">COD Status</span>
                  <span className="font-bold text-emerald-400">Available</span>
                </div>
                <div className="p-2 rounded bg-black/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Free Delivery</span>
                  <span className="font-bold text-emerald-400">On ₹499+</span>
                </div>
                <div className="p-2 rounded bg-black/20">
                  <span className="text-[10px] text-slate-400 block uppercase">Dispatch Hub</span>
                  <span className="font-bold text-primary-200">{result.hub}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Delivery Tiers & SLAs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-600" />
              <span>HodaExpress (Next-Day)</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Available across top tier-1 cities including Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Chennai, and Pune for orders placed before 4:00 PM.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>Standard Nationwide Delivery</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Guaranteed delivery within 2 to 4 business days across all verified non-metro districts and remote regions.
            </p>
          </div>
        </div>
      </section>
    </ContentPageLayout>
  );
};
