import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';

export const PrivacyPolicyPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Privacy Policy"
      subtitle="Compliant with the Digital Personal Data Protection (DPDP) Act, 2023 of India."
      category="Consumer Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900">1. Information We Collect</h2>
        <p>
          When you interact with HodaHub, we collect information necessary to fulfill your orders and personalize
          your shopping experience:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li><strong>Identity & Contact:</strong> Mobile number, full name, delivery addresses, and optional email address.</li>
          <li><strong>Transaction Records:</strong> Items ordered, payment method used, transaction timestamps, and invoice details.</li>
          <li><strong>Device & Usage Data:</strong> IP address, device model, browser client identifiers, and search history.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">2. How We Use Your Personal Data</h2>
        <p>
          We use your data solely for lawful, customer-centric purposes:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Processing, confirming, and delivering your orders via our courier network.</li>
          <li>Sending critical transactional alerts via SMS (e.g., OTP codes, order confirmations, arrival dates).</li>
          <li>Preventing fraud, unauthorized logins, and marketplace abuse.</li>
        </ul>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">3. Non-Sale of Personal Information</h2>
        <p>
          HodaHub does not sell, rent, or trade your personal data to third-party data brokers or external advertisers.
          Data is only shared with verified logistics partners (for doorstep delivery) and payment gateways (for transaction clearing).
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">4. Your Rights Under DPDP Act</h2>
        <p>
          You have the statutory right to access, rectify, or request the deletion of your personal data stored with HodaHub.
          To exercise your data privacy rights, write to our Data Protection Officer at <strong className="text-primary-600">dpo@hodahub.com</strong>.
        </p>
      </section>
    </ContentPageLayout>
  );
};
