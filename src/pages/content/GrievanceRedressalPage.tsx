import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { ShieldCheck, Mail, Phone, MapPin, Scale } from 'lucide-react';

export const GrievanceRedressalPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Grievance Redressal Mechanism"
      subtitle="In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and Information Technology Rules, 2021."
      category="Consumer Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">Consumer Grievance Redressal Framework</h2>
        <p>
          HodaHub has designated a dedicated Grievance Officer and Nodal Contact Person to ensure that customer
          complaints and escalation concerns are acknowledged within 48 hours and redressed within 30 days from
          the date of receipt.
        </p>
      </section>

      {/* Officer Contact Box */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 my-4">
        <div className="flex items-center gap-2 text-primary-700 font-bold text-xs uppercase tracking-wider">
          <Scale className="w-4 h-4 text-primary-600" />
          <span>Statutory Grievance Officer Details</span>
        </div>
        <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
          <p><strong>Name:</strong> Rajeshwari Natarajan</p>
          <p><strong>Designation:</strong> Senior Manager — Consumer Affairs & Legal Grievance Officer</p>
          <p><strong>Company:</strong> HodaHub Internet Private Limited</p>
          <p><strong>Address:</strong> Embassy Tech Village, Outer Ring Road, Devarabeesanahalli, Bengaluru 560103, Karnataka</p>
          <p><strong>Email:</strong> <a href="mailto:grievance-officer@hodahub.com" className="text-primary-600 font-bold hover:underline">grievance-officer@hodahub.com</a></p>
          <p><strong>Direct Line:</strong> 044-67415899 (Mon to Fri, 09:30 AM to 06:00 PM IST)</p>
        </div>
      </div>

      <section className="space-y-3 pt-2">
        <h3 className="text-base font-extrabold text-slate-900">3-Tier Escalation Matrix</h3>
        <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
          <li>
            <strong>Level 1 — 24x7 Customer Support:</strong> Submit your query via our{' '}
            <span className="text-primary-600 font-bold">Contact Us</span> form or call toll-free at 1800-202-9898.
          </li>
          <li>
            <strong>Level 2 — Priority Escalation Desk:</strong> If unresolved within 48 hours, escalate to{' '}
            <strong className="text-slate-900">priority-support@hodahub.com</strong> quoting your Ticket ID.
          </li>
          <li>
            <strong>Level 3 — Grievance Officer:</strong> If unsatisfied with prior responses, write directly to the
            Grievance Officer via the details specified above.
          </li>
        </ol>
      </section>
    </ContentPageLayout>
  );
};
