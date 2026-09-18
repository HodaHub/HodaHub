import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';
import { SEO } from '../../components/common/SEO';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onNavigateStorefront?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateStorefront,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAdminAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-primary-500 selection:text-white">
      <SEO
        title="Admin Portal Login | HodaHub"
        description="Secure administrator portal login for HodaHub Operations and merchant control."
        canonicalUrl="https://hodahub.in/admin/login"
        noindex={true}
      />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative glowing corner accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white mb-2 shadow-lg shadow-primary-600/30">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-white font-sans">Hoda</span>
            <span className="text-xl font-black tracking-tight text-primary-400 font-sans">Hub</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 rounded uppercase tracking-wider">
              Operations Hub
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Internal administrative access. Authorized personnel only.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Admin Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 font-mono text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-primary-500 font-mono text-xs transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 active:scale-[0.99] text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Authenticating with HodaHub...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Storefront Link */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onNavigateStorefront || (() => (window.location.href = '/'))}
            className="text-slate-400 hover:text-slate-200 text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to HodaHub Storefront</span>
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-600 mt-6 font-mono">
        HodaHub Protected Infrastructure &bull; Role-Based Access Control (RBAC)
      </div>
    </div>
  );
};
