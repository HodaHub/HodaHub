import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Video,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Truck,
  FileCheck,
  ChevronLeft,
} from 'lucide-react';
import { BaseModal } from '../common/BaseModal';
import { useAuthStore } from '../../store/useAuthStore';

interface ReplacementPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  sku?: string;
}

type PolicyTab = 'replacement' | 'refund' | 'exchange';

export const ReplacementPolicyModal: React.FC<ReplacementPolicyModalProps> = ({
  isOpen,
  onClose,
  productTitle = 'this product',
  sku,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PolicyTab>('replacement');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [orderId, setOrderId] = useState('HODA-ORD-2026-904128');
  const [reason, setReason] = useState('Defective / Technical Glitch');
  const [videoConfirmed, setVideoConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    orderId: string;
    type: string;
    date: string;
  } | null>(null);

  const handleResetAndClose = () => {
    setIsFormOpen(false);
    setSubmittedTicket(null);
    onClose();
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = `HODA-RET-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newRequest = {
        ticketId: generatedId,
        orderId: orderId.trim(),
        type: activeTab.toUpperCase(),
        reason,
        sku: sku || 'HODA-SKU-GENERAL',
        productTitle,
        customerName: user?.name || 'HodaHub Customer',
        customerPhone: user?.phone || '',
        videoConfirmed,
        notes,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage for persistence
      try {
        const existing = JSON.parse(localStorage.getItem('hodahub_return_requests') || '[]');
        localStorage.setItem('hodahub_return_requests', JSON.stringify([newRequest, ...existing]));
      } catch (err) {
        console.error('Error saving return request', err);
      }

      setSubmittedTicket({
        ticketId: generatedId,
        orderId: orderId.trim(),
        type: activeTab.toUpperCase(),
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      maxWidth="max-w-lg"
      icon={<RotateCcw className="w-5 h-5 text-primary-600" />}
      title="10-Day Replacement Policy"
    >
      {!isFormOpen ? (
        <div className="space-y-4">
          {/* Three Tab-like Pills */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab('replacement')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'replacement'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Replacement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('refund')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'refund'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Refund
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exchange')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'exchange'
                  ? 'bg-white text-primary-700 shadow-xs border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exchange
            </button>
          </div>

          {/* Dynamic Description Pill Context */}
          <div className="p-3 bg-primary-50/60 rounded-xl border border-primary-100 text-xs text-primary-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold capitalize">{activeTab} Guarantee: </span>
              {activeTab === 'replacement' &&
                'Free doorstep replacement with a brand-new factory unit if your item arrives damaged, defective, or incorrect.'}
              {activeTab === 'refund' &&
                '100% refund credited back to original payment method or HodaHub Wallet once inspection is complete.'}
              {activeTab === 'exchange' &&
                'Hassle-free size or color variant swap within 10 days of delivery.'}
            </div>
          </div>

          {/* Conditions List (Bulleted) */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Mandatory Conditions for Claim
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>
                  <strong>360° unboxing video required</strong> (must show intact package seal with zero cuts/pauses).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Report within 24 hours</strong> of courier delivery timestamp.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                <span>
                  Item must be <strong>100% sealable/unused</strong> with all original tags, accessories, and warranty cards intact.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Exchange shipping paid by customer</strong> for voluntary size/color exchanges where no defect exists.
                </span>
              </li>
            </ul>
          </div>

          {/* "Unboxing Video" Sub-section */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
              <Video className="w-4 h-4 text-amber-700" />
              <span>Unboxing Video Guidelines (Strictly Required)</span>
            </div>
            <ol className="space-y-1.5 text-xs text-amber-900">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Record before opening:</strong> Film all 6 sides of outer packaging and ensure shipping label is clearly readable.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Open fully on camera without pause/cut:</strong> Unseal box, show contents, serial numbers, and inspect unit in one continuous take.
                </span>
              </li>
            </ol>
          </div>

          {/* Small Note Bar: Shipping/RTO Terms */}
          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Ground shipping 1-7 days. RTO charges mandatory on undelivered returns.</span>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <span>Raise Request →</span>
          </button>
        </div>
      ) : submittedTicket ? (
        /* Confirmation State after raising request */
        <div className="p-4 space-y-3.5 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">Request Submitted Successfully</h4>
            <p className="text-xs text-slate-500 mt-1">
              Your claim has been logged with HodaHub Returns Desk.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Ticket ID:</span>
              <span className="font-bold text-primary-700">{submittedTicket.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Order ID:</span>
              <span className="font-bold text-slate-900">{submittedTicket.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Claim Type:</span>
              <span className="font-bold text-slate-800">{submittedTicket.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Status:</span>
              <span className="font-bold text-emerald-700">Verification Pending</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-left">
            ℹ️ Please keep your <strong>360° unboxing video file</strong> ready. An HodaHub verification specialist will contact you via WhatsApp / SMS within 24 business hours.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetAndClose}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedTicket(null);
                setIsFormOpen(false);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Back to Policy
            </button>
          </div>
        </div>
      ) : (
        /* Real Request Flow Form */
        <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Policy</span>
            </button>
            <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wide">
              {activeTab} Claim Form
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Order ID *
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. HODA-ORD-2026-XXXXXX"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-primary-500 bg-white"
            />
            {isAuthenticated && (
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-linked with your recent HodaHub account order.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Reason for Request *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500"
            >
              <option value="Defective / Technical Glitch">Defective / Technical Glitch</option>
              <option value="Damaged in transit / Unboxing issue">Damaged in transit / Outer seal compromised</option>
              <option value="Different item received">Different item / Model received</option>
              <option value="Missing accessories">Missing accessories or booklet</option>
              <option value="Size / Color exchange request">Size / Color exchange preference</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Additional Details / Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain what went wrong with the package..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary-500 bg-white"
            />
          </div>

          {/* Checkbox for unboxing video */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={videoConfirmed}
              onChange={(e) => setVideoConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-[11px] text-amber-950 leading-snug">
              I confirm I have a <strong>continuous 360° unboxing video without cuts/pauses</strong> ready to share with the HodaHub inspection team.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-70"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Submit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Request</span>
              </>
            )}
          </button>
        </form>
      )}
    </BaseModal>
  );
};
