import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { ShieldAlert, FileWarning, CheckCircle2, Mail } from 'lucide-react';

export const ReportInfringementPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Report Infringement & IP Notice"
      subtitle="Intellectual property protection policy and takedown procedure on HodaHub."
      category="Help & Legal Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">Intellectual Property Rights Policy</h2>
        <p>
          HodaHub is committed to removing infringing products and listings from our marketplace. We strictly
          respect the intellectual property rights of trademark holders, copyright owners, patent assignees, and
          licensed brands.
        </p>
      </section>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Important Notice for Rights Owners</strong>
          If you believe that your intellectual property right has been infringed by a product listing or seller on
          HodaHub, you may submit a formal Notice of Infringement under the Indian Copyright Act, 1957 and Trade
          Marks Act, 1999.
        </div>
      </div>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Required Information for Takedown Notice</h3>
        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
          <li>Exact legal name of the intellectual property owner or authorized agent.</li>
          <li>Registration certificate number and jurisdiction of trademark/copyright/patent.</li>
          <li>Direct HodaHub URL or SKU of the specific infringing item.</li>
          <li>Description of the alleged infringement and specific claims.</li>
          <li>Declaration of good faith belief signed by the rights holder under penalty of perjury.</li>
        </ol>
      </section>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <p className="font-bold text-slate-900">Submit IP Complaints To:</p>
        <p>
          IP Rights & Takedown Desk<br />
          Email: <strong className="text-primary-600">ip-infringement@hodahub.com</strong><br />
          HodaHub Internet Private Limited, Embassy Tech Village, Bengaluru 560103.
        </p>
      </div>
    </ContentPageLayout>
  );
};
