import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Target, Zap, Users, Award, ShieldCheck } from 'lucide-react';

export const AboutUsPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="About HodaHub"
      subtitle="Pioneering modern e-commerce with high-density technology and deep Indian roots."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">Empowering 1.4 Billion Indian Shoppers</h2>
        <p>
          Founded in Bengaluru, <strong>HodaHub</strong> is engineered to combine the high-conversion,
          information-dense e-commerce layouts trusted by millions of Indian shoppers with a state-of-the-art
          2026 design language and hyper-fast logistics infrastructure.
        </p>
        <p>
          From the latest 5G flagship smartphones and high-performance laptops to authentic ethnic fashion and
          daily home essentials, HodaHub delivers 100% genuine products directly from authorized brands and
          verified regional sellers across more than 19,000 postal pincodes.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Customer-First Promise</h3>
          <p className="text-xs text-slate-500">
            Transparent pricing in Indian Rupees (₹), verified purchase buyer reviews, doorstep returns, and
            7-day replacement policies with zero hassle.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">The HodaAssured Standard</h3>
          <p className="text-xs text-slate-500">
            Every product with an HodaAssured badge undergoes a 6-point quality verification protocol to ensure
            original manufacturer seals and genuine warranties.
          </p>
        </div>
      </div>

      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Our Pan-India Supply Chain Network</h3>
        <p>
          With automated fulfillment centers in Bengaluru, Mumbai, Gurugram, Hyderabad, and Kolkata, HodaHub
          operates high-speed supply chains that guarantee next-day delivery in major metropolitan hubs and 48-hour
          delivery into Tier 2 and Tier 3 cities across Bharat.
        </p>
      </section>
    </ContentPageLayout>
  );
};
