import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Building2, Landmark, FileText, CheckCircle2 } from 'lucide-react';

export const CorporateInfoPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Corporate Information"
      subtitle="Statutory company details, registered offices, corporate governance, and compliance."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">Entity & Registration Details</h2>
        <p>
          <strong>HodaHub Internet Private Limited</strong> is an incorporated Indian entity registered under
          the Companies Act, 2013, operating online retail marketplaces, logistics, and digital consumer services.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-sans">Corporate Identification Number (CIN):</span>
            <span className="font-bold text-slate-900">U51109KA2026PTC066107</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-sans">Date of Incorporation:</span>
            <span className="font-bold text-slate-900">14 January 2026</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-1.5">
            <span className="text-slate-500 font-sans">Registration ROC:</span>
            <span className="font-bold text-slate-900">ROC Bangalore, Karnataka</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">GSTIN (Principal Place):</span>
            <span className="font-bold text-slate-900">29AAKCO9812L1Z4</span>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Registered Office</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          HodaHub Internet Private Limited,<br />
          Buildings Alyssa, Begonia & Clove Embassy Tech Village,<br />
          Outer Ring Road, Devarabeesanahalli Village,<br />
          Bengaluru, Karnataka - 560103, India.<br />
          Telephone: 044-45614700 / 044-67415800
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Board of Directors & Governance</h3>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Anand Rao — Managing Director & Chief Executive Officer</li>
          <li>Siddharth Varma — Director, Technology & Engineering</li>
          <li>Kavita Krishnan — Independent Director & Audit Committee Chair</li>
        </ul>
      </section>
    </ContentPageLayout>
  );
};
