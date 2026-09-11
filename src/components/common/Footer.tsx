import React from 'react';
import { ShoppingBag, ShieldCheck, HelpCircle, Gift, Award, RotateCcw, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const renderLink = (to: string, pageKey: string, label: string) => {
    if (onNavigate) {
      return (
        <button
          onClick={() => onNavigate(pageKey)}
          className="hover:text-white transition-colors text-left"
        >
          {label}
        </button>
      );
    }
    return (
      <Link to={to} className="hover:text-white transition-colors">
        {label}
      </Link>
    );
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-8 sm:pt-10 pb-8 mt-12 w-full max-w-full overflow-hidden">
      {/* 4 Trust Value Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">100% Genuine</p>
              <p className="text-slate-400 text-xs">Direct brand warranty & HodaAssured</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">7-Day Easy Returns</p>
              <p className="text-slate-400 text-xs">Doorstep pickup & instant refunds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">Express Delivery</p>
              <p className="text-slate-400 text-xs">Free delivery across 19,000+ pincodes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-950 border border-primary-800/50 flex items-center justify-center text-primary-400 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm">HodaCoins Rewards</p>
              <p className="text-slate-400 text-xs">Earn 4 coins on every ₹100 spent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links - All 16 Verified Routes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Column 1: About HodaHub */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">ABOUT HODAHUB</p>
            <ul className="space-y-2">
              <li>{renderLink('/contact-us', 'contact-us', 'Contact Us')}</li>
              <li>{renderLink('/about-us', 'about-us', 'About Us')}</li>
              <li>{renderLink('/careers', 'careers', 'Careers')}</li>
              <li>{renderLink('/hodahub-stories', 'hodahub-stories', 'HodaHub Stories')}</li>
              <li>{renderLink('/press-media', 'press-media', 'Press & Media')}</li>
              <li>{renderLink('/corporate-information', 'corporate-information', 'Corporate Information')}</li>
            </ul>
          </div>

          {/* Column 2: Help */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">HELP</p>
            <ul className="space-y-2">
              <li>{renderLink('/track-order', 'track-order', 'Track Your Order')}</li>
              <li>{renderLink('/payments-info', 'payments-info', 'Payments')}</li>
              <li>{renderLink('/shipping-pincodes', 'shipping-pincodes', 'Shipping & Pincodes')}</li>
              <li>{renderLink('/cancellation-returns', 'cancellation-returns', 'Cancellation & Returns')}</li>
              <li>{renderLink('/faq', 'faq', 'FAQ')}</li>
              <li>{renderLink('/report-infringement', 'report-infringement', 'Report Infringement')}</li>
            </ul>
          </div>

          {/* Column 3: Consumer Policy */}
          <div>
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">CONSUMER POLICY</p>
            <ul className="space-y-2">
              <li>{renderLink('/cancellation-returns', 'cancellation-returns', 'Cancellation & Returns')}</li>
              <li>{renderLink('/terms-of-use', 'terms-of-use', 'Terms of Use')}</li>
              <li>{renderLink('/security', 'security', 'Security')}</li>
              <li>{renderLink('/privacy-policy', 'privacy-policy', 'Privacy Policy')}</li>
              <li>{renderLink('/sitemap', 'sitemap', 'Sitemap')}</li>
              <li>{renderLink('/grievance-redressal', 'grievance-redressal', 'Grievance Redressal')}</li>
            </ul>
          </div>

          {/* Column 4 - Address */}
          <div className="border-t pt-4 sm:pt-0 sm:border-t-0 md:border-l border-slate-800 md:pl-4">
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">MAIL US</p>
            <p className="text-slate-400 leading-relaxed text-xs">
              HodaHub Internet Private Limited,<br />
              Buildings Alyssa, Begonia & Clove Embassy Tech Village,<br />
              Outer Ring Road, Devarabeesanahalli Village,<br />
              Bengaluru, 560103, Karnataka, India
            </p>
          </div>

          {/* Column 5 - Office */}
          <div className="border-t pt-4 sm:pt-0 sm:border-t-0 border-slate-800">
            <p className="text-slate-200 uppercase font-bold tracking-wider text-xs mb-3">REGISTERED OFFICE</p>
            <p className="text-slate-400 leading-relaxed text-xs">
              HodaHub Internet Private Limited,<br />
              CIN: U51109KA2026PTC066107<br />
              Telephone: 044-45614700 / 044-67415800<br />
              Email: support@hodahub.com
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            {renderLink('/contact-us', 'contact-us', 'Become a HodaSeller')}
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            {renderLink('/faq', 'faq', 'Gift Cards')}
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            {renderLink('/faq', 'faq', 'Help Center')}
          </span>
        </div>

        <div className="text-center md:text-right font-medium">
          © 2026 HodaHub.com. All rights reserved. Built with precision for Indian shoppers.
        </div>
      </div>
    </footer>
  );
};
