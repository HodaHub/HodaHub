import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { RotateCcw, CheckCircle2, ShieldAlert, Clock, HelpCircle } from 'lucide-react';

export const CancellationReturnsPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Cancellation & Returns Policy"
      subtitle="Simple, transparent 7-day return and cancellation policy designed with zero friction."
      category="Help & Consumer Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">7-Day Easy Doorstep Returns</h2>
        <p>
          At HodaHub, customer satisfaction is our top priority. Most physical items purchased on the platform
          can be returned or exchanged within <strong>7 days of delivery</strong> provided they remain unused, with
          original manufacturer packaging, tags, and accessories intact.
        </p>
      </section>

      {/* 3 Step Return Process */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs mb-2">1</div>
          <h4 className="font-bold text-slate-900 text-xs">Request from Orders</h4>
          <p className="text-xs text-slate-500 mt-1">Navigate to your order history and select Return or Replace.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs mb-2">2</div>
          <h4 className="font-bold text-slate-900 text-xs">Doorstep Inspection</h4>
          <p className="text-xs text-slate-500 mt-1">Our HodaExpress executive picks up the package and performs a quick quality check.</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
          <h4 className="font-bold text-slate-900 text-xs">Instant Refund</h4>
          <p className="text-xs text-slate-500 mt-1">Your refund is triggered immediately upon successful doorstep verification.</p>
        </div>
      </div>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Order Cancellation Window</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Orders can be cancelled at zero penalty at any time <strong>before shipment</strong> from the seller hub.
          Once an order has been handed over to the courier partner, cancellation can be requested at the time of delivery
          by refusing the parcel.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Non-Returnable Product Categories</h3>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Innerwear, lingerie, and personal hygiene consumables.</li>
          <li>Opened software licenses and digital download codes.</li>
          <li>Customized or personalized goods made to buyer specifications.</li>
        </ul>
      </section>
    </ContentPageLayout>
  );
};
