import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';

export const TermsOfUsePage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Terms of Use"
      subtitle="Last updated: 1 January 2026. Governing your access and transactions on the HodaHub platform."
      category="Consumer Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900">1. Acceptance of Platform Terms</h2>
        <p>
          This document is an electronic record under the Information Technology Act, 2000 and rules thereunder.
          By accessing, browsing, or shopping on <strong>HodaHub.com</strong> or our mobile applications, you agree
          to be bound by these Terms of Use and all related policies incorporated herein by reference.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">2. User Accounts & Verification</h2>
        <p>
          You are responsible for maintaining the confidentiality of your mobile number and one-time passwords (OTP).
          You agree to accept responsibility for all activities that occur under your registered account. HodaHub
          reserves the right to suspend or terminate accounts that provide fraudulent or inaccurate registration details.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">3. Commercial Pricing & Payments</h2>
        <p>
          All prices displayed on HodaHub are in Indian Rupees (₹) and inclusive of applicable Goods and Services Tax (GST).
          While we strive to ensure accurate pricing across the entire catalog, errors may occasionally occur. If an item is
          inadvertently mispriced, HodaHub reserves the right to cancel the order prior to dispatch and refund any collected amount.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">4. Shipping & Delivery Commitment</h2>
        <p>
          Delivery timelines displayed as "estimated delivery dates" reflect operational logistics schedules. HodaHub works
          with contracted courier services to ensure timely arrival; however, events beyond reasonable control (such as severe
          weather, transport strikes, or regional public emergencies) may alter scheduled delivery dates.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900">5. Governing Law & Jurisdiction</h2>
        <p>
          These Terms of Use shall be governed by and interpreted in accordance with the laws of India. Any legal dispute
          or proceedings arising out of or related to platform usage shall be subject to the exclusive jurisdiction of the
          competent courts at Bengaluru, Karnataka.
        </p>
      </section>
    </ContentPageLayout>
  );
};
