import React from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { ShieldCheck, Lock, KeyRound, Cpu, AlertTriangle } from 'lucide-react';

export const SecurityPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <ContentPageLayout
      title="Security & Data Protection"
      subtitle="How HodaHub protects your personal data, payment details, and transactions."
      category="Consumer Policy"
      onNavigate={onNavigate}
    >
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900">Enterprise-Grade Security Architecture</h2>
        <p>
          At HodaHub, we implement multi-layer defense-in-depth security architectures to ensure that your
          browsing activity, order records, and payment credentials are safe from unauthorized intrusion.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <Lock className="w-5 h-5 text-primary-600 mb-1" />
          <h4 className="font-bold text-slate-900 text-sm">256-Bit TLS Encryption</h4>
          <p className="text-xs text-slate-500">
            Every web request and mobile API payload is encrypted using modern TLS 1.3 cryptographic ciphers.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <KeyRound className="w-5 h-5 text-primary-600 mb-1" />
          <h4 className="font-bold text-slate-900 text-sm">RBI Tokenization Standard</h4>
          <p className="text-xs text-slate-500">
            Card details are replaced with surrogate cryptographic tokens, ensuring your actual card number is never stored on disk.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <Cpu className="w-5 h-5 text-primary-600 mb-1" />
          <h4 className="font-bold text-slate-900 text-sm">AI Fraud Prevention</h4>
          <p className="text-xs text-slate-500">
            Real-time machine learning heuristics detect account takeover attempts, anomalous order spikes, and bot activity.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <ShieldCheck className="w-5 h-5 text-primary-600 mb-1" />
          <h4 className="font-bold text-slate-900 text-sm">Hashed OTP Credentials</h4>
          <p className="text-xs text-slate-500">
            Verification codes are strictly hashed using SHA-256 with 5-minute expiry, preventing brute-force exposure.
          </p>
        </div>
      </div>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-base font-extrabold text-slate-900">Responsible Disclosure & Bug Bounty</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          If you are a security researcher and have identified a vulnerability in any HodaHub service or API,
          please disclose responsibly by emailing <strong className="text-primary-600">security@hodahub.com</strong>.
          We acknowledge all verifiable reports within 24 hours.
        </p>
      </section>
    </ContentPageLayout>
  );
};
