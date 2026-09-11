import React, { useState } from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

interface ContactUsPageProps {
  onNavigate?: (page: string) => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const generatedInqId = `INQ-${Date.now().toString().slice(-6)}`;
      setInquiryId(generatedInqId);
      setSubmitted(true);
    } catch (err) {
      setInquiryId(`INQ-${Date.now().toString().slice(-6)}`);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContentPageLayout
      title="Contact HodaHub Support"
      subtitle="We are here 24x7 to assist you with order queries, returns, payments, and seller partnerships."
      category="About HodaHub"
      onNavigate={onNavigate}
    >
      {/* Contact Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <Phone className="w-5 h-5 text-primary-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs uppercase">Customer Care</h4>
          <p className="text-xs text-slate-500">1800-202-9898 (Toll Free)</p>
          <p className="text-[11px] text-slate-400">Available 24 hours / 7 days</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <Mail className="w-5 h-5 text-primary-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs uppercase">Email Helpline</h4>
          <p className="text-xs text-slate-500">support@hodahub.com</p>
          <p className="text-[11px] text-slate-400">Guaranteed response in 24h</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <MapPin className="w-5 h-5 text-primary-600 mb-2" />
          <h4 className="font-bold text-slate-900 text-xs uppercase">Headquarters</h4>
          <p className="text-xs text-slate-500">Embassy Tech Village, ORR</p>
          <p className="text-[11px] text-slate-400">Bengaluru 560103, India</p>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-emerald-950">Inquiry Submitted Successfully!</h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Your support ticket <strong className="font-mono text-emerald-950">{inquiryId}</strong> has
            been created. An HodaHub customer associate will get in touch with you shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            }}
            className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Submit Another Query
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="font-extrabold text-slate-900 text-base">Send Us a Direct Message</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@domain.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Query Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Order tracking, Return request, etc."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message *</label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Please describe your query in detail, including any relevant Order ID..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
          </button>
        </form>
      )}
    </ContentPageLayout>
  );
};
