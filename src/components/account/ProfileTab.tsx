import React, { useState } from 'react';
import { User, Phone, Mail, ShieldCheck, Check, Save, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const ProfileTab: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name, email);
      showToast('HodaHub profile details saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
        <p className="text-xs text-slate-500">
          Manage your personal details, verified mobile credentials, and contact preferences on HodaHub.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 max-w-xl text-xs">
        {/* Full Name */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anand Rao"
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 font-medium transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Mobile Number (Read-only, Verified) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-slate-700 font-bold">
              Mobile Number
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>OTP Verified</span>
            </span>
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              disabled
              value={user?.phone || '+91 98765 43210'}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs cursor-not-allowed select-none"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Your registered mobile number is verified via OTP and serves as your primary HodaHub identifier.
          </p>
        </div>

        {/* Optional Email */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">
            Email Address <span className="text-slate-400 font-normal">(Optional, for invoices & receipts)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. anand.rao@example.com"
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-primary-500 font-medium transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Security & Account Status Pill */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xl space-y-2 text-xs">
        <div className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-600" />
          <span>HodaHub Account Protection</span>
        </div>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          Your account is secured with mobile phone OTP multi-factor verification. All order receipts, courier delivery tracking alerts, and refund notifications will be dispatched to your verified credentials.
        </p>
      </div>
    </div>
  );
};
