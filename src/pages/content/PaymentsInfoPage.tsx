import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { CreditCard, ShieldCheck, Smartphone, Landmark, Banknote, RefreshCw } from 'lucide-react';

export const PaymentsInfoPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Payments & Security Information"
      subtitle="Comprehensive guide to supported Indian payment options, security standards, and refund timelines."
      category="Help & Support"
      onNavigate={onNavigate}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Smartphone className="w-5 h-5 text-primary-600" />
          <h4 className="font-bold text-slate-900 text-sm">UPI & Instant Payments</h4>
          <p className="text-xs text-slate-600">
            Pay directly via Google Pay, PhonePe, Paytm, or any BHIM UPI ID with zero surcharge and instantaneous confirmation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <CreditCard className="w-5 h-5 text-primary-600" />
          <h4 className="font-bold text-slate-900 text-sm">Credit & Debit Cards</h4>
          <p className="text-xs text-slate-600">
            Visa, MasterCard, RuPay, and American Express supported. 3D Secure OTP verification mandated on all domestic card transactions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Landmark className="w-5 h-5 text-primary-600" />
          <h4 className="font-bold text-slate-900 text-sm">Net Banking & EMI</h4>
          <p className="text-xs text-slate-600">
            Supported across 50+ Indian banks including HDFC, ICICI, SBI, and Axis Bank. No-cost EMI available on eligible credit cards.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <Banknote className="w-5 h-5 text-primary-600" />
          <h4 className="font-bold text-slate-900 text-sm">Cash on Delivery (COD)</h4>
          <p className="text-xs text-slate-600">
            Available across qualifying items and pincodes. Pay cash or scan courier UPI QR code at your doorstep.
          </p>
        </div>
      </div>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Payment Security & RBI Compliance</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          HodaHub is fully PCI-DSS Level 1 compliant. Card details are never stored on HodaHub servers in plain text;
          all transactions utilize RBI-mandated device tokenization and end-to-end 256-bit TLS cryptographic encryption.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Refund Settlement Timelines</h3>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 border-b font-bold">
              <tr>
                <th className="p-2.5">Original Payment Method</th>
                <th className="p-2.5">Refund Settlement SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5">UPI / Net Banking</td>
                <td className="p-2.5 font-bold text-emerald-600">Instant to 24 Hours</td>
              </tr>
              <tr>
                <td className="p-2.5">Credit / Debit Card</td>
                <td className="p-2.5">3 to 5 Business Days</td>
              </tr>
              <tr>
                <td className="p-2.5">Cash on Delivery (COD)</td>
                <td className="p-2.5">Direct to Bank Account within 24 Hours of Return Pickup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </ContentPageLayout>
  );
};
