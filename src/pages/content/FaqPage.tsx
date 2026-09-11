import React, { useState } from 'react';
import { ContentPageLayout } from '../../components/common/ContentPageLayout';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

export const FaqPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchFilter, setSearchFilter] = useState('');

  const faqs = [
    {
      q: 'What does the HodaAssured badge signify on a product?',
      a: 'The HodaAssured badge is our gold standard for authentic Indian e-commerce. Products with this badge are sourced strictly from authorized distributors or verified brand partners, undergo a 6-point physical quality check, and qualify for guaranteed 2-day delivery with hassle-free 7-day returns.',
    },
    {
      q: 'How does Mobile Number + OTP login work on HodaHub?',
      a: 'HodaHub uses seamless phone-based passwordless authentication. Simply enter your 10-digit Indian mobile number to receive a secure 6-digit verification code. Once verified, your cart, address book, and order history are automatically loaded.',
    },
    {
      q: 'When will I know my confirmed delivery date after placing an order?',
      a: 'Immediately after placing an order, your status will reflect "Delivery date will be confirmed shortly" while our automated logistics engine checks real-time inventory at the closest fulfillment hub. Once verified by our logistics team, you will receive an SMS confirmation with the exact arrival date.',
    },
    {
      q: 'What payment modes are accepted on HodaHub?',
      a: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay, Amex), Net Banking across 50+ banks, No-Cost EMI, and Cash on Delivery (COD).',
    },
    {
      q: 'Can I cancel an order after it has been placed?',
      a: 'Yes, you can cancel any order free of charge directly from your "My Orders" dashboard as long as the status has not changed to Shipped. If already shipped, you can simply refuse the delivery when the courier partner arrives.',
    },
    {
      q: 'How long do refunds take to reflect in my bank account?',
      a: 'For UPI and Net Banking payments, refunds are typically processed within 2 to 24 hours. For Credit and Debit cards, settlement usually takes 3 to 5 business days depending on your bank.',
    },
    {
      q: 'What is the delivery fee policy?',
      a: 'HodaHub offers 100% Free Express Delivery on all orders with a cart subtotal of ₹499 or above. For smaller orders under ₹499, a nominal flat delivery charge of ₹40 is applied to cover handling and logistics.',
    },
    {
      q: 'How do I apply coupon codes like HODA500 or FESTIVE10?',
      a: 'During checkout or on the Cart page, expand the "Apply Coupon" section in the Price Details sidebar, enter your coupon code, and click Apply. The discount will instantly be deducted from your payable total.',
    },
    {
      q: 'What should I do if I receive a damaged or incorrect product?',
      a: 'Please report damaged or incorrect items within 48 hours of delivery from your Orders page or call our 24x7 helpline at 1800-202-9898. We will arrange a priority doorstep replacement with zero return shipping costs.',
    },
    {
      q: 'How can I become a HodaSeller and list my products?',
      a: 'Click "Become a HodaSeller" in the top header or footer. You will need a valid GSTIN, bank account, and PAN card. Most verified sellers go live and start receiving orders within 24 hours of document submission.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.a.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <ContentPageLayout
      title="Frequently Asked Questions (FAQ)"
      subtitle="Quick answers to common questions about ordering, payments, returns, and delivery."
      category="Help & Support"
      onNavigate={onNavigate}
    >
      {/* Search Filter Bar */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search questions (e.g. returns, payment, delivery date)..."
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 font-medium"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-white"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-primary-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ContentPageLayout>
  );
};
