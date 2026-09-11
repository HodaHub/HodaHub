import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { isAuthModalOpen, closeAuthModal, sendOtp, verifyOtp, resendOtp, isLoading, error } =
    useAuthStore();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('PHONE');
      setPhoneNumber('');
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(30);
      setIsResendDisabled(true);
      setErrorMessage(null);
    }
  }, [isAuthModalOpen]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any = null;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isAuthModalOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setErrorMessage(null);
    const success = await sendOtp(clean);
    if (success) {
      setStep('OTP');
      setCountdown(30);
      setIsResendDisabled(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    const digit = numeric.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6th digit is entered
    if (index === 5 || newDigits.every((d) => d !== '')) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === 6) {
        submitVerification(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const splitDigits = pastedData.split('');
      setOtpDigits(splitDigits);
      inputRefs.current[5]?.focus();
      submitVerification(pastedData);
    }
  };

  const submitVerification = async (code: string) => {
    setErrorMessage(null);
    const success = await verifyOtp(code);
    if (success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(error || 'Incorrect OTP code entered. Please try again.');
    }
  };

  const handleResend = async () => {
    if (isResendDisabled || isLoading) return;
    setIsResendDisabled(true);
    setCountdown(30);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    await resendOtp();
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Visual Banner */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 pb-8 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            {step === 'PHONE' ? (
              <Smartphone className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {step === 'PHONE' ? 'Sign in to HodaHub' : 'Verify Mobile OTP'}
          </h2>
          <p className="text-primary-100 text-xs mt-1 max-w-xs mx-auto">
            {step === 'PHONE'
              ? 'Enter your phone number to access your orders, cart, and wishlist'
              : `6-digit verification code sent to +91 ${phoneNumber}`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-6 -mt-3 bg-white rounded-t-2xl relative">
          {(errorMessage || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage || error}
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="relative flex rounded-xl border border-slate-200 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100 transition-all shadow-sm">
                  <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-bold text-sm rounded-l-xl select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(v);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter 10-digit number"
                    autoFocus
                    className="flex-1 px-3 py-3 text-slate-900 font-mono font-medium text-base focus:outline-none rounded-r-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phoneNumber.length !== 10}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-400">
                  By continuing, you agree to HodaHub's{' '}
                  <span className="text-primary-600 underline cursor-pointer">Terms of Use</span> and{' '}
                  <span className="text-primary-600 underline cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  <button
                    onClick={() => {
                      setStep('PHONE');
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-xs text-primary-600 font-semibold hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                {/* 6-Box OTP Input */}
                <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-14 text-center font-mono font-bold text-xl border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => submitVerification(otpDigits.join(''))}
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              {/* Resend OTP cooldown timer */}
              <div className="text-center pt-1">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend code in <span className="font-mono font-bold text-slate-700">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HodaHub 100% Secure Instant Verification</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
